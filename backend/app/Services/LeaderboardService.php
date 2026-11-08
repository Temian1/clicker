<?php

namespace App\Services;

use App\Models\GameRun;
use App\Models\LeaderboardScore;
use App\Models\OvertakeAlert;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Daily / weekly / all-time leaderboards + "someone passed you" alerts.
 *
 * When a player's score goes from $old to $new, every player whose score was
 * strictly between the two has just been overtaken. Each of them receives an
 * OvertakeAlert row, which their client picks up via GET /api/alerts.
 */
class LeaderboardService
{
    public const PERIODS = ['daily', 'weekly', 'all'];

    /** 'coins' = total coins earned; or a game mode = best run score. */
    public const BOARDS = ['coins', 'catcher', 'whack'];

    /** @return array<string,string> period => period_key */
    public function keys(?CarbonInterface $now = null): array
    {
        $now = ($now ?? now())->copy()->setTimezone(config('game.timezone'));

        return [
            'daily' => $now->format('Y-m-d'),
            'weekly' => $now->format('o-\WW'),
            'all' => 'all',
        ];
    }

    /**
     * Add earned coins to all three boards.
     *
     * @return array<int, array{name:string, period:string, new_rank:int}> players this user just passed
     */
    public function addScore(User $user, int $delta): array
    {
        if ($delta <= 0) {
            return [];
        }

        $passed = [];
        $budget = (int) config('game.max_alerts_per_sync', 50);

        DB::transaction(function () use ($user, $delta, &$passed, &$budget) {
            foreach ($this->keys() as $period => $key) {
                $row = LeaderboardScore::query()
                    ->where(['user_id' => $user->id, 'period' => $period, 'period_key' => $key])
                    ->lockForUpdate()
                    ->first()
                    ?? LeaderboardScore::create(['user_id' => $user->id, 'period' => $period, 'period_key' => $key, 'score' => 0]);

                $old = (int) $row->score;
                $new = $old + $delta;
                $row->update(['score' => $new]);

                if ($budget <= 0) {
                    continue;
                }

                $victims = LeaderboardScore::query()
                    ->with('user:id,name,avatar')
                    ->where('period', $period)
                    ->where('period_key', $key)
                    ->where('user_id', '!=', $user->id)
                    ->where('score', '>', $old)
                    ->where('score', '<', $new)
                    ->orderByDesc('score')
                    ->limit($budget)
                    ->get();

                $myRank = $this->rankFor($period, $key, $new);

                foreach ($victims as $v) {
                    OvertakeAlert::create([
                        'user_id' => $v->user_id,
                        'by_user_id' => $user->id,
                        'period' => $period,
                        'new_rank' => $this->rankFor($period, $key, (int) $v->score),
                    ]);
                    if (count($passed) < 5) {
                        $passed[] = ['name' => $v->user?->name ?? 'Player', 'period' => $period, 'new_rank' => $myRank];
                    }
                    $budget--;
                }
            }
        });

        return $passed;
    }

    public function rankFor(string $period, string $key, int $score): int
    {
        return LeaderboardScore::where('period', $period)
            ->where('period_key', $key)
            ->where('score', '>', $score)
            ->count() + 1;
    }

    /** Start of the period in the game timezone (null = all-time). */
    public function periodStart(string $period, ?CarbonInterface $now = null): ?CarbonInterface
    {
        $now = ($now ?? now())->copy()->setTimezone(config('game.timezone'));

        return match ($period) {
            'daily' => $now->startOfDay()->utc(),
            'weekly' => $now->startOfWeek()->utc(),
            default => null,
        };
    }

    /**
     * Best run score per player for a game mode within the period.
     *
     * @return array{board:string, period:string, entries:array, me:array, total:int}
     */
    public function gameBoard(string $mode, string $period, User $me): array
    {
        $since = $this->periodStart($period);
        $base = GameRun::query()
            ->where('mode', $mode)
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since));

        $rows = (clone $base)
            ->selectRaw('user_id, MAX(score) as best')
            ->groupBy('user_id')
            ->orderByDesc('best')
            ->limit((int) config('game.leaderboard_size', 50))
            ->with('user:id,name,avatar')
            ->get();

        $entries = $rows->values()->map(fn ($r, int $i) => [
            'user_id' => (string) $r->user_id,
            'name' => $r->user?->name ?? 'Player',
            'avatar' => $r->user?->avatar ?? '😎',
            'score' => (int) $r->best,
            'rank' => $i + 1,
            'is_me' => $r->user_id === $me->id,
        ])->all();

        $myBest = (int) ((clone $base)->where('user_id', $me->id)->max('score') ?? 0);
        $bests = (clone $base)->selectRaw('user_id, MAX(score) as best')->groupBy('user_id');
        $above = DB::query()->fromSub($bests, 'b')->where('best', '>', $myBest)->count();
        $total = DB::query()->fromSub((clone $base)->select('user_id')->distinct(), 'u')->count();
        $played = (clone $base)->where('user_id', $me->id)->exists();

        return [
            'board' => $mode,
            'period' => $period,
            'entries' => $entries,
            'me' => ['user_id' => (string) $me->id, 'name' => $me->name, 'avatar' => $me->avatar, 'score' => $myBest, 'rank' => $played ? $above + 1 : $total + 1, 'is_me' => true],
            'total' => $total,
        ];
    }

    /** @return array{board:string, period:string, entries:array, me:array, total:int} */
    public function board(string $period, User $me, string $board = 'coins'): array
    {
        if ($board !== 'coins') {
            return $this->gameBoard($board, $period, $me);
        }

        $key = $this->keys()[$period];
        $limit = (int) config('game.leaderboard_size', 50);

        $rows = LeaderboardScore::query()
            ->with('user:id,name,avatar')
            ->where('period', $period)
            ->where('period_key', $key)
            ->orderByDesc('score')
            ->orderBy('updated_at')
            ->limit($limit)
            ->get();

        $entries = $rows->values()->map(fn (LeaderboardScore $r, int $i) => [
            'user_id' => (string) $r->user_id,
            'name' => $r->user?->name ?? 'Player',
            'avatar' => $r->user?->avatar ?? '😎',
            'score' => (int) $r->score,
            'rank' => $i + 1,
            'is_me' => $r->user_id === $me->id,
        ])->all();

        $myScore = (int) (LeaderboardScore::where(['user_id' => $me->id, 'period' => $period, 'period_key' => $key])->value('score') ?? 0);

        return [
            'board' => 'coins',
            'period' => $period,
            'entries' => $entries,
            'me' => [
                'user_id' => (string) $me->id,
                'name' => $me->name,
                'avatar' => $me->avatar,
                'score' => $myScore,
                'rank' => $this->rankFor($period, $key, $myScore),
                'is_me' => true,
            ],
            'total' => LeaderboardScore::where('period', $period)->where('period_key', $key)->count(),
        ];
    }
}

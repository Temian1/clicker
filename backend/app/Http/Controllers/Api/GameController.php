<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Character;
use App\Models\LeaderboardScore;
use App\Models\OvertakeAlert;
use App\Models\SupportTicket;
use App\Services\LeaderboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Smaller game endpoints: roster, leaderboard, alerts, battles, support.
 */
class GameController extends Controller
{
    public function __construct(private LeaderboardService $boards) {}

    /** Public roster. Characters added by admins appear here instantly. */
    public function characters(): JsonResponse
    {
        $chars = Character::where('is_active', true)->orderBy('sort_order')->orderBy('id')->get();

        return response()->json(['data' => $chars->map->toClient()->values()]);
    }

    public function leaderboard(Request $request): JsonResponse
    {
        $period = $request->validate([
            'period' => ['nullable', Rule::in(LeaderboardService::PERIODS)],
        ])['period'] ?? 'daily';

        return response()->json($this->boards->board($period, $request->user()));
    }

    /** "X passed you" alerts for the current player. */
    public function alerts(Request $request): JsonResponse
    {
        $q = OvertakeAlert::with('byUser:id,name,avatar')
            ->where('user_id', $request->user()->id)
            ->latest('created_at')
            ->limit(30);

        if ($request->boolean('unread')) {
            $q->whereNull('read_at');
        }

        return response()->json([
            'data' => $q->get()->map(fn (OvertakeAlert $a) => [
                'id' => $a->id,
                'by_name' => $a->byUser?->name ?? 'Player',
                'by_avatar' => $a->byUser?->avatar ?? '😎',
                'period' => $a->period,
                'new_rank' => $a->new_rank,
                'read' => $a->read_at !== null,
                'created_at' => $a->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function markAlertsRead(Request $request): JsonResponse
    {
        $data = $request->validate(['ids' => ['nullable', 'array'], 'ids.*' => ['string']]);

        $q = OvertakeAlert::where('user_id', $request->user()->id)->whereNull('read_at');
        if (! empty($data['ids'])) {
            $q->whereIn('id', $data['ids']);
        }
        $count = $q->update(['read_at' => now()]);

        return response()->json(['marked' => $count]);
    }

    /** Ghost opponent for the 60s tap duel: a real ranked player near your score. */
    public function duelOpponent(Request $request): JsonResponse
    {
        $me = $request->user();
        $key = $this->boards->keys()['all'];
        $myScore = (int) (LeaderboardScore::where(['user_id' => $me->id, 'period' => 'all', 'period_key' => $key])->value('score') ?? 0);

        $pool = LeaderboardScore::with('user:id,name,avatar', 'user.progress')
            ->where('period', 'all')
            ->where('user_id', '!=', $me->id)
            ->orderByRaw('ABS(CAST(score AS SIGNED) - ?)', [$myScore])
            ->limit(10)
            ->get();
        $opponent = $pool->isEmpty() ? null : $pool->random();

        $best = (int) ($opponent?->user?->progress?->best_duel ?? 0);

        return response()->json([
            'name' => $opponent?->user?->name ?? 'Ghost Tapper',
            'avatar' => $opponent?->user?->avatar ?? '👻',
            // taps-per-second the ghost will play at
            'tps' => $best > 0 ? round(min(12, $best / 60), 2) : round(4 + mt_rand(0, 300) / 100, 2),
        ]);
    }

    public function bossResult(Request $request): JsonResponse
    {
        $data = $request->validate([
            'win' => ['required', 'boolean'],
            'taps' => ['required', 'integer', 'min:0', 'max:2000'],
            'level' => ['required', 'integer', 'min:1'],
        ]);
        $p = $request->user()->progress()->firstOrCreate([]);
        $p->update([
            'best_boss' => max($p->best_boss, $data['taps']),
            'boss_level' => $data['win'] ? max($p->boss_level, $data['level'] + 1) : $p->boss_level,
        ]);

        return response()->json(['data' => $p->only(['best_boss', 'boss_level'])]);
    }

    public function duelResult(Request $request): JsonResponse
    {
        $data = $request->validate([
            'win' => ['required', 'boolean'],
            'taps' => ['required', 'integer', 'min:0', 'max:1500'],
        ]);
        $p = $request->user()->progress()->firstOrCreate([]);
        $p->update(['best_duel' => max($p->best_duel, $data['taps'])]);

        return response()->json(['data' => $p->only(['best_duel'])]);
    }

    public function support(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category' => ['required', Rule::in(['bug', 'idea', 'account', 'other'])],
            'message' => ['required', 'string', 'min:5', 'max:5000'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $ticket = SupportTicket::create($data + ['user_id' => $request->user()?->id]);

        return response()->json(['data' => $ticket], 201);
    }
}

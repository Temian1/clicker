<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameRun;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Finished runs of Promise Catcher / Whack-a-Politician.
 * The client batches runs into its heartbeat, so this accepts up to 20 at once.
 */
class RunController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'runs' => ['required', 'array', 'min:1', 'max:20'],
            'runs.*.mode' => ['required', Rule::in(GameRun::MODES)],
            'runs.*.score' => ['required', 'integer', 'min:0'],
            'runs.*.duration_ms' => ['required', 'integer', 'min:1000', 'max:1800000'],
            'runs.*.max_combo' => ['nullable', 'integer', 'min:0'],
            'runs.*.character_id' => ['nullable', 'string', 'max:64'],
        ]);

        $user = $request->user();
        $cap = (float) config('game.max_score_per_second');
        $saved = [];

        DB::transaction(function () use ($data, $user, $cap, &$saved) {
            $p = $user->progress()->firstOrCreate([]);
            $updates = ['total_runs' => $p->total_runs];

            foreach ($data['runs'] as $r) {
                // anti-cheat: a run can't score faster than humanly possible
                $max = (int) ceil($cap * $r['duration_ms'] / 1000);
                $score = min((int) $r['score'], $max);

                $run = GameRun::create([
                    'user_id' => $user->id,
                    'mode' => $r['mode'],
                    'score' => $score,
                    'submitted_score' => (int) $r['score'],
                    'duration_ms' => $r['duration_ms'],
                    'max_combo' => $r['max_combo'] ?? 0,
                    'character_id' => $r['character_id'] ?? null,
                    'flagged' => $score < (int) $r['score'],
                ]);
                $saved[] = $run->only(['id', 'mode', 'score', 'flagged']);

                $col = 'best_'.$r['mode'];
                $updates[$col] = max($updates[$col] ?? $p->{$col}, $score);
                $updates['total_runs']++;
            }
            $p->update($updates);
        });

        return response()->json(['data' => $saved], 201);
    }

    /** The player's recent runs. */
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => GameRun::where('user_id', $request->user()->id)->latest('created_at')->limit(30)->get(),
        ]);
    }
}

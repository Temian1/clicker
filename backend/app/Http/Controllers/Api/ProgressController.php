<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LeaderboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function __construct(private LeaderboardService $boards) {}

    /** Cloud save: fetch. */
    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->progress()->firstOrCreate([])]);
    }

    /** Cloud save: overwrite the full client state blob. */
    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'state' => ['required', 'array'],
            'selected_character' => ['nullable', 'string', 'max:64'],
        ]);
        $p = $request->user()->progress()->firstOrCreate([]);
        $p->update($data);

        return response()->json(['data' => $p]);
    }

    /**
     * Heartbeat from the client (every ~4s): coins & taps earned since the last
     * sync. Updates the leaderboards and creates overtake alerts for anyone passed.
     */
    public function sync(Request $request): JsonResponse
    {
        $data = $request->validate([
            'coins' => ['required', 'numeric', 'min:0'],
            'taps' => ['required', 'integer', 'min:0'],
            'character_id' => ['nullable', 'string', 'max:64'],
            'best_combo' => ['nullable', 'integer', 'min:0'],
        ]);

        $user = $request->user();
        $p = $user->progress()->firstOrCreate([]);

        // basic anti-cheat: clamp to what is humanly / economically possible
        $elapsed = $p->last_sync_at ? max(1, min(60, (int) now()->diffInSeconds($p->last_sync_at, true))) : 5;
        $maxTaps = (int) ceil(config('game.max_taps_per_second') * $elapsed);
        $maxCoins = (int) ceil((config('game.max_coins_per_second_base') + $p->total_earned * config('game.max_coins_per_second_growth')) * $elapsed);
        $taps = min((int) $data['taps'], $maxTaps);
        $coins = min((int) floor($data['coins']), $maxCoins);

        $p->update([
            'total_taps' => $p->total_taps + $taps,
            'total_earned' => $p->total_earned + $coins,
            'best_combo' => max($p->best_combo, (int) ($data['best_combo'] ?? 0)),
            'selected_character' => $data['character_id'] ?? $p->selected_character,
            'last_sync_at' => now(),
        ]);
        $user->forceFill(['last_seen_at' => now()])->save();

        $passed = $this->boards->addScore($user, $coins);

        return response()->json([
            'accepted' => ['coins' => $coins, 'taps' => $taps],
            'clamped' => $coins < (int) floor($data['coins']) || $taps < (int) $data['taps'],
            'you_passed' => $passed,
        ]);
    }
}

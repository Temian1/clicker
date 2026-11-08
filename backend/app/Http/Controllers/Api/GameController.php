<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Character;
use App\Models\OvertakeAlert;
use App\Models\SupportTicket;
use App\Services\LeaderboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Smaller game endpoints: roster, leaderboards, alerts, support.
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
        $data = $request->validate([
            'period' => ['nullable', Rule::in(LeaderboardService::PERIODS)],
            'board' => ['nullable', Rule::in(LeaderboardService::BOARDS)],
        ]);

        return response()->json($this->boards->board($data['period'] ?? 'daily', $request->user(), $data['board'] ?? 'coins'));
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

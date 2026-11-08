<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Character;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Admin management: add new characters (the game never ends — the roster keeps
 * growing), moderate players and handle support tickets.
 */
class AdminController extends Controller
{
    // ----- characters --------------------------------------------------------
    public function characters(): JsonResponse
    {
        return response()->json(['data' => Character::orderBy('sort_order')->get()]);
    }

    public function storeCharacter(Request $request): JsonResponse
    {
        $character = Character::create($this->validateCharacter($request));

        return response()->json(['data' => $character], 201);
    }

    public function updateCharacter(Request $request, Character $character): JsonResponse
    {
        $character->update($this->validateCharacter($request, $character));

        return response()->json(['data' => $character]);
    }

    public function destroyCharacter(Character $character): JsonResponse
    {
        // soft-retire instead of deleting so existing saves keep working
        $character->update(['is_active' => false]);

        return response()->json(null, 204);
    }

    private function validateCharacter(Request $request, ?Character $existing = null): array
    {
        $req = $existing ? 'sometimes' : 'required';

        return $request->validate([
            'slug' => [$req, 'alpha_dash', 'max:64', Rule::unique('characters', 'slug')->ignore($existing?->id)],
            'name' => [$req, 'string', 'max:80'],
            'title' => [$req, 'string', 'max:120'],
            'bio' => [$req, 'string', 'max:1000'],
            'unlock_cost' => [$req, 'integer', 'min:0'],
            'coin_bonus' => [$req, 'numeric', 'min:0.1', 'max:100'],
            'look' => [$req, 'array'],
            'look.skin' => [$req, 'string'],
            'look.skinShade' => [$req, 'string'],
            'look.robe' => [$req, 'string'],
            'look.robeTrim' => [$req, 'string'],
            'look.robePattern' => [$req, Rule::in(['stripes', 'dots', 'embroidery', 'zigzag'])],
            'look.cap' => [$req, 'string'],
            'look.capTrim' => [$req, 'string'],
            'look.headwear' => [$req, Rule::in(['fila', 'gele', 'okpu', 'zanna', 'bowler', 'beret'])],
            'look.facialHair' => [$req, Rule::in(['none', 'moustache', 'beard', 'goatee'])],
            'look.build' => [$req, Rule::in(['round', 'tall', 'stout'])],
            'look.accessories' => ['sometimes', 'array'],
            'look.accessories.*' => [Rule::in(['sunglasses', 'bag', 'mic', 'phone', 'beads', 'passport', 'fan', 'calculator'])],
            'look.lipstick' => ['sometimes', 'nullable', 'string'],
            'lines' => ['sometimes', 'nullable', 'array'],
            'promises' => ['sometimes', 'nullable', 'array'],
            'promises.*' => ['string', 'max:200'],
            'coming_soon' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);
    }

    // ----- players -----------------------------------------------------------
    public function setBan(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['banned' => ['required', 'boolean']]);
        $user->forceFill(['is_banned' => $data['banned']])->save();

        return response()->json(['data' => ['id' => $user->id, 'is_banned' => $user->is_banned]]);
    }

    // ----- support -----------------------------------------------------------
    public function tickets(Request $request): JsonResponse
    {
        $q = SupportTicket::with('user:id,name')->latest();
        if ($s = $request->query('status')) {
            $q->where('status', $s);
        }

        return response()->json($q->paginate(30));
    }

    public function updateTicket(Request $request, SupportTicket $ticket): JsonResponse
    {
        $ticket->update($request->validate(['status' => ['required', Rule::in(['open', 'in_progress', 'closed'])]]));

        return response()->json(['data' => $ticket]);
    }
}

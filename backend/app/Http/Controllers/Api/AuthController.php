<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Create or resume a guest player from a device id. */
    public function guest(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id' => ['required', 'string', 'max:64'],
            'nickname' => ['required', 'string', 'min:2', 'max:18'],
            'avatar' => ['nullable', 'string', 'max:16'],
        ]);

        $user = User::firstOrCreate(
            ['device_id' => $data['device_id']],
            ['name' => $data['nickname'], 'avatar' => $data['avatar'] ?? '😎'],
        );

        // only a guest (no password) may be resumed by device id alone
        if ($user->password !== null && ! $user->wasRecentlyCreated) {
            throw ValidationException::withMessages(['device_id' => 'This device is linked to an account. Please log in.']);
        }

        $user->update(['name' => $data['nickname'], 'avatar' => $data['avatar'] ?? $user->avatar, 'last_seen_at' => now()]);
        $user->progress()->firstOrCreate([]);

        return response()->json([
            'token' => $user->createToken('guest')->plainTextToken,
            'user' => $this->present($user),
        ], $user->wasRecentlyCreated ? 201 : 200);
    }

    /** Upgrade the current guest into a full account (keeps progress). */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = $request->user();
        $user->update(['email' => $data['email'], 'password' => $data['password']]);

        return response()->json(['user' => $this->present($user)]);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();
        if (! $user || ! Hash::check($data['password'], (string) $user->password)) {
            throw ValidationException::withMessages(['email' => 'Invalid credentials.']);
        }

        return response()->json([
            'token' => $user->createToken('login')->plainTextToken,
            'user' => $this->present($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->present($request->user()->load('progress'))]);
    }

    private function present(User $u): array
    {
        return [
            'id' => (string) $u->id,
            'name' => $u->name,
            'avatar' => $u->avatar,
            'email' => $u->email,
            'is_guest' => $u->password === null,
            'is_admin' => (bool) $u->is_admin,
            'progress' => $u->relationLoaded('progress') ? $u->progress : null,
        ];
    }
}

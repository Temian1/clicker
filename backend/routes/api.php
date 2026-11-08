<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureNotBanned;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tap The Politician — API  (see /backend/API.md)
|--------------------------------------------------------------------------
*/

// ---- public ---------------------------------------------------------------
Route::post('auth/guest', [AuthController::class, 'guest'])->middleware('throttle:20,1');
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::get('characters', [GameController::class, 'characters']);

// ---- authenticated players ------------------------------------------------
Route::middleware(['auth:sanctum', EnsureNotBanned::class])->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::get('progress', [ProgressController::class, 'show']);
    Route::put('progress', [ProgressController::class, 'save']);
    Route::post('progress/sync', [ProgressController::class, 'sync'])->middleware('throttle:60,1');

    Route::get('leaderboard', [GameController::class, 'leaderboard']);
    Route::get('alerts', [GameController::class, 'alerts']);
    Route::post('alerts/read', [GameController::class, 'markAlertsRead']);

    Route::get('duels/opponent', [GameController::class, 'duelOpponent']);
    Route::post('duels/results', [GameController::class, 'duelResult']);
    Route::post('boss/results', [GameController::class, 'bossResult']);

    Route::post('support', [GameController::class, 'support'])->middleware('throttle:5,1');

    // ---- admin ------------------------------------------------------------
    Route::prefix('admin')->middleware(EnsureAdmin::class)->group(function () {
        Route::get('characters', [AdminController::class, 'characters']);
        Route::post('characters', [AdminController::class, 'storeCharacter']);
        Route::patch('characters/{character}', [AdminController::class, 'updateCharacter']);
        Route::delete('characters/{character}', [AdminController::class, 'destroyCharacter']);
        Route::post('users/{user}/ban', [AdminController::class, 'setBan']);
        Route::get('support', [AdminController::class, 'tickets']);
        Route::patch('support/{ticket}', [AdminController::class, 'updateTicket']);
    });
});

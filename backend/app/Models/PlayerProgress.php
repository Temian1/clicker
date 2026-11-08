<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerProgress extends Model
{
    protected $table = 'player_progress';

    protected $fillable = [
        'user_id', 'total_earned', 'total_taps', 'best_combo', 'best_boss', 'best_duel',
        'boss_level', 'selected_character', 'state', 'last_sync_at',
    ];

    protected function casts(): array
    {
        return [
            'state' => 'array',
            'last_sync_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

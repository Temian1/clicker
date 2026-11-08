<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameRun extends Model
{
    public const UPDATED_AT = null;

    public const MODES = ['catcher', 'whack'];

    protected $fillable = ['user_id', 'mode', 'score', 'submitted_score', 'duration_ms', 'max_combo', 'character_id', 'flagged'];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'submitted_score' => 'integer',
            'duration_ms' => 'integer',
            'max_combo' => 'integer',
            'flagged' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

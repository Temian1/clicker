<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaderboardScore extends Model
{
    protected $fillable = ['user_id', 'period', 'period_key', 'score'];

    protected function casts(): array
    {
        return ['score' => 'integer'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

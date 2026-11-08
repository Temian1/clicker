<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Character extends Model
{
    protected $fillable = [
        'slug', 'name', 'title', 'bio', 'unlock_cost', 'coin_bonus',
        'look', 'lines', 'promises', 'coming_soon', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'look' => 'array',
            'lines' => 'array',
            'promises' => 'array',
            'coin_bonus' => 'float',
            'unlock_cost' => 'integer',
            'coming_soon' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /** Shape expected by the React client (CharacterDef). */
    public function toClient(): array
    {
        return array_filter([
            'id' => $this->slug,
            'name' => $this->name,
            'title' => $this->title,
            'bio' => $this->bio,
            'unlockCost' => $this->unlock_cost,
            'coinBonus' => $this->coin_bonus,
            'look' => $this->look,
            'lines' => $this->lines,
            'promises' => $this->promises,
            'comingSoon' => $this->coming_soon ?: null,
        ], fn ($v) => $v !== null);
    }
}

<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'device_id', 'avatar', 'last_seen_at'];

    protected $hidden = ['password', 'remember_token', 'device_id'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'is_banned' => 'boolean',
        ];
    }

    public function progress(): HasOne
    {
        return $this->hasOne(PlayerProgress::class);
    }

    public function scores(): HasMany
    {
        return $this->hasMany(LeaderboardScore::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(OvertakeAlert::class);
    }
}

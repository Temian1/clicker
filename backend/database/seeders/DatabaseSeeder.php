<?php

namespace Database\Seeders;

use App\Models\Character;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Roster shared with the frontend (exported from frontend/src/game/characters.ts)
        $chars = json_decode(file_get_contents(database_path('data/characters.json')), true);

        foreach ($chars as $i => $c) {
            Character::updateOrCreate(['slug' => $c['id']], [
                'name' => $c['name'],
                'title' => $c['title'],
                'bio' => $c['bio'],
                'unlock_cost' => $c['unlockCost'],
                'coin_bonus' => $c['coinBonus'],
                'look' => $c['look'],
                'lines' => $c['lines'] ?? null,
                'promises' => $c['promises'] ?? null,
                'coming_soon' => $c['comingSoon'] ?? false,
                'sort_order' => $i,
            ]);
        }

        User::updateOrCreate(['email' => 'admin@tapthepolitician.test'], [
            'name' => 'Admin',
            'password' => 'password',
            'avatar' => '👑',
        ])->forceFill(['is_admin' => true])->save();
    }
}

<?php

namespace Tests\Feature;

use App\Models\Character;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameApiTest extends TestCase
{
    use RefreshDatabase;

    private function guest(string $device, string $name): string
    {
        return $this->postJson('/api/auth/guest', ['device_id' => $device, 'nickname' => $name, 'avatar' => '🔥'])
            ->assertSuccessful()
            ->json('token');
    }

    /** Act as a player; forget cached guards so switching tokens mid-test works. */
    private function player(string $token): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token);
    }

    public function test_characters_are_served_from_the_seeded_roster(): void
    {
        $this->seed();

        $this->getJson('/api/characters')
            ->assertOk()
            ->assertJsonPath('data.0.id', 'chief-promise')
            ->assertJsonStructure(['data' => [['id', 'name', 'unlockCost', 'coinBonus', 'look' => ['headwear', 'accessories']]]]);
    }

    public function test_overtaking_a_player_creates_an_alert_for_them(): void
    {
        $tunde = $this->guest('dev-tunde', 'Tunde');
        $chioma = $this->guest('dev-chioma', 'Chioma');

        // Tunde earns 500
        $this->player($tunde)->postJson('/api/progress/sync', ['coins' => 500, 'taps' => 50])->assertOk();

        // Chioma earns 800 and passes Tunde on all three boards
        $this->player($chioma)->postJson('/api/progress/sync', ['coins' => 800, 'taps' => 80])
            ->assertOk()
            ->assertJsonPath('you_passed.0.name', 'Tunde')
            ->assertJsonPath('you_passed.0.new_rank', 1);

        // Tunde sees three unread alerts (daily, weekly, all-time)
        $alerts = $this->player($tunde)->getJson('/api/alerts?unread=1')->assertOk()->json('data');
        $this->assertCount(3, $alerts);
        $this->assertSame('Chioma', $alerts[0]['by_name']);
        $this->assertSame(2, $alerts[0]['new_rank']);

        $this->player($tunde)->postJson('/api/alerts/read')->assertOk()->assertJsonPath('marked', 3);
        $this->assertCount(0, $this->player($tunde)->getJson('/api/alerts?unread=1')->json('data'));
    }

    public function test_leaderboard_ranks_players_and_includes_me(): void
    {
        $a = $this->guest('dev-a', 'Ada');
        $b = $this->guest('dev-b', 'Bayo');
        $this->player($a)->postJson('/api/progress/sync', ['coins' => 100, 'taps' => 10]);
        $this->player($b)->postJson('/api/progress/sync', ['coins' => 300, 'taps' => 30]);

        $this->player($a)->getJson('/api/leaderboard?period=weekly')
            ->assertOk()
            ->assertJsonPath('entries.0.name', 'Bayo')
            ->assertJsonPath('me.rank', 2)
            ->assertJsonPath('me.score', 100)
            ->assertJsonPath('total', 2);
    }

    public function test_sync_clamps_impossible_tap_counts(): void
    {
        $t = $this->guest('dev-cheat', 'Cheater');
        $this->player($t)->postJson('/api/progress/sync', ['coins' => 10, 'taps' => 100000])
            ->assertOk()
            ->assertJsonPath('clamped', true)
            ->assertJsonPath('accepted.taps', 125); // 25 taps/s × 5s first-sync window
    }

    public function test_only_admins_can_add_characters(): void
    {
        $this->seed();
        $player = $this->guest('dev-p', 'Player');
        $payload = [
            'slug' => 'hon-traffic', 'name' => 'Hon. Traffic Jam', 'title' => 'Minister of Go-Slow', 'bio' => 'Never arrives on time.',
            'unlock_cost' => 3000000, 'coin_bonus' => 2.6,
            'look' => [
                'skin' => '#8d5524', 'skinShade' => '#6b3e18', 'robe' => '#00897b', 'robeTrim' => '#ffeb3b', 'robePattern' => 'dots',
                'cap' => '#ffeb3b', 'capTrim' => '#00897b', 'headwear' => 'fila', 'facialHair' => 'none', 'build' => 'tall',
                'accessories' => ['phone'],
            ],
        ];

        $this->player($player)->postJson('/api/admin/characters', $payload)->assertForbidden();

        $admin = User::where('email', 'admin@tapthepolitician.test')->first();
        $this->actingAs($admin)->postJson('/api/admin/characters', $payload)->assertCreated();
        $this->assertTrue(Character::where('slug', 'hon-traffic')->exists());
        $this->getJson('/api/characters')->assertJsonFragment(['id' => 'hon-traffic']);
    }
}

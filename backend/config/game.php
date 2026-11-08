<?php

return [
    // Anti-cheat ceilings applied to POST /api/progress/sync
    'max_taps_per_second' => env('GAME_MAX_TAPS_PER_SECOND', 25),
    // coins/sec ceiling = base + total_earned * growth (lets late-game players earn more)
    'max_coins_per_second_base' => env('GAME_MAX_COINS_BASE', 50_000),
    'max_coins_per_second_growth' => env('GAME_MAX_COINS_GROWTH', 0.02),
    // A run can't score faster than this many points per second (Catcher / Whack)
    'max_score_per_second' => env('GAME_MAX_SCORE_PER_SECOND', 60),
    // Max overtake alerts generated per sync (protects DB on huge jumps)
    'max_alerts_per_sync' => 50,
    'leaderboard_size' => 50,
    'timezone' => env('GAME_TIMEZONE', 'Africa/Lagos'),
];

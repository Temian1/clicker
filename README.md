# Tap The Politician 🇳🇬

A Nigerian political-satire clicker, rebuilt from the old Banana Clicker in **React 19 + Three.js**. Tap cartoon portrayals of Nigerian political figures until the agbada rumples, the cap flies off and *wahala don land*. The game never ends: every meltdown re-elects the politician into a harder term, and admins can add new characters at any time.

> Satire. Names and likenesses depict public figures; dialogue, promises and reactions are invented for comedy. No endorsement. The game has no real-world rankings or approval scores.

```
tap-the-politician/
├── frontend/   React 19 · TypeScript · Vite 8 · Three.js (React Three Fiber + drei) · Tailwind 4 · Motion · Zustand
├── backend/    Laravel 13 · Sanctum API · leaderboards · overtake alerts · admin   → see backend/API.md
└── docs/       CHARACTER_PROMPTS.md (art prompts) · CODEX_CHARACTER_BRIEF.md (brief for Codex to add characters)
```

## Features

- **Layered SVG characters** that react to taps. Robe, pattern, wrinkles, eyes, brows, mouth, sunglasses, headwear, sweat, tears, steam and props all change on their own across 6 stages (Fresh Agbada → Wahala Don Land). Each character is defined by data, so a new politician is just a config object.
- **Three.js scene** with floating 3D gold coins, a rotating rally sunburst, and instanced confetti bursts on stage-ups, meltdowns and wins.
- **Tap feel**: multi-touch, 3D tilt toward the tap point, squash and stretch, floating `+N` numbers, combo multiplier, x10 jackpot taps, haptics, speech bubbles ("Abeg, na wetin I do?"), optional TTS voice lines, synthesized SFX and an afrobeat-style loop.
- **Economy**: tap coins, energy (generator), 6 upgrades, Hype Man auto-earner with offline income, Full Tank and Turbo Rally boosts, character unlocks with coin bonuses.
- **Economy Wahala events**: every 1–2 minutes the economy hits your pocket (petrol price hike, Naira falls, new tax, bank charges, toll gate, NEPA tariff). Tap fast to PROTEST and block it, or lose coins, energy, or tap earnings for a while. Rare palliative events pay out if you tap fast enough.
- **Levels**: each meltdown is a level-up that unlocks and moves you to the next politician in the cast.
- **Endless progression**: terms 1, 2, 3 and on with higher thresholds and bigger rewards.
- **Battle**: Rally Boss (fill the comedy meter before the absurd promises run out; levels never stop) and Tap Duel (60 seconds against a ghost of a ranked player).
- **Leaderboard**: daily, weekly and all-time, with a podium and personal highscores. **When someone passes you, you get a pop-up, a sound, a vibration and a badge.**
- **Daily**: login-streak rewards and 3 date-seeded challenges per day.
- **Menus**: profile and avatar, settings, alerts inbox, how to play, support (FAQ + contact form), and a WhatsApp share card (PNG screenshot plus share link).

## Run the frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173: plays fully offline with a simulated leaderboard
npm run build
```

Offline mode simulates rival players who keep pace with you, so overtake alerts work with no server.

## Go online with Laravel

```bash
cd backend
composer install && cp .env.example .env && php artisan key:generate
php artisan migrate --seed && php artisan serve       # http://localhost:8000
# then in frontend/.env
VITE_API_URL=http://localhost:8000
```

The full API contract is in [backend/API.md](backend/API.md). Run `php artisan test` for the feature tests (auth, sync, leaderboard ranks, overtake alerts, anti-cheat clamping, admin character creation).

## Adding a character

- **Offline / bundled:** add an object to `frontend/src/game/characters.ts`.
- **Online:** `POST /api/admin/characters` with the same fields. Clients load the roster from `GET /api/characters` at launch.
- **Art:** see [docs/CHARACTER_PROMPTS.md](docs/CHARACTER_PROMPTS.md).

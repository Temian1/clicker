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

Two arcade games starring the cast:

- **Promise Catcher**: the politician paces the rally stage throwing things. Drag the "Ghana-must-go" basket to catch dividends (💵 🍚 🍞 💡 📚), dodge empty promises 💬, fuel prices ⛽ and tax bills 🧾, and grab power-ups (🧲 magnet, ⭐ x2, 🛡️ shield, 🐢 slow-mo, ❤️). It speeds up forever; three bad catches and it's over.
- **Whack-a-Politician**: 45 seconds, 9 podiums. Tap politicians to VOTE THEM OUT before they duck, never tap citizens 👩🏾‍🌾, golden politicians are x5 and ⏱️ adds time.

Around them:

- **Levels through the cast**: every run's score fills the current politician's wahala meter through 6 sprite poses (they panic live during the run). At the meltdown you level up and the next politician steps up; after the whole cast they return one term harder, so it never ends.
- **Today's Wahala**: about 40% of runs get an economy twist (petrol price jump, Naira falls, NEPA blackout, tax season) that makes the run harder but pays bonus coins, or a rare palliative season.
- **Combos** (up to x3), golden items, hearts.
- **Shop** (deliberately expensive): coin bonus, wider basket, naira magnet, extra hearts, golden luck, calmer speed-up.
- **Leaderboards**: coins, best Catcher score and best Whack score, each daily, weekly and all-time, with a pop-up whenever someone passes you.
- **Daily**: login streak and 3 date-seeded challenges (play N games, score N, catch N, vote out N…).
- **Three.js** background with 3D coins and confetti bursts on stage-ups, level-ups and new bests.
- Menus: profile, settings, alerts inbox, how to play, support (FAQ + contact form), WhatsApp share card.

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

The full API contract is in [backend/API.md](backend/API.md). Run `php artisan test` for the feature tests (auth, sync, runs, per-game leaderboards, overtake alerts, anti-cheat clamping, admin character creation).

## Adding a character

- **Offline / bundled:** add an object to `frontend/src/game/characters.ts`.
- **Online:** `POST /api/admin/characters` with the same fields. Clients load the roster from `GET /api/characters` at launch.
- **Art:** see [docs/CHARACTER_PROMPTS.md](docs/CHARACTER_PROMPTS.md).

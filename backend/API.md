# Tap The Politician — Laravel API

Base URL: `http://localhost:8000/api` · Auth: **Sanctum bearer tokens** (`Authorization: Bearer <token>`) · All bodies JSON.

The React client talks to this API when built with `VITE_API_URL=http://localhost:8000`. Without it, the client runs fully offline with a simulated leaderboard (`frontend/src/api/localApi.ts`) that follows the same contract.

## Quick start

```bash
cd backend
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed          # seeds the 7-character roster + an admin user
php artisan serve                   # http://localhost:8000
php artisan test                    # API feature tests
```

Seeded admin: `admin@tapthepolitician.test` / `password` (change this before you deploy).

---

## Auth

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/guest` | – | `{device_id, nickname, avatar?}` | Creates or resumes a guest from a device id. Returns `{token, user}`. 201 when the guest is new. |
| POST | `/auth/register` | ✔ | `{email, password}` | Upgrades the current guest to a full account and keeps its progress. |
| POST | `/auth/login` | – | `{email, password}` | Returns `{token, user}`. |
| POST | `/auth/logout` | ✔ | – | Revokes the current token. |
| GET | `/me` | ✔ | – | `{user}`, including `progress`. |

## Game

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/characters` | – | `{data: CharacterDef[]}`, in the same shape as `frontend/src/game/types.ts`. Public. |
| GET | `/progress` | – | Cloud save: `{data: PlayerProgress}` |
| PUT | `/progress` | `{state: object, selected_character?}` | Overwrites the cloud save blob. |
| **POST** | **`/progress/sync`** | `{coins, taps, character_id?, best_combo?}` | **Heartbeat, about every 4s.** Adds the delta to the daily, weekly and all-time boards and creates overtake alerts. Returns `{accepted:{coins,taps}, clamped:bool, you_passed:[{name, period, new_rank}]}` |
| GET | `/leaderboard?period=daily\|weekly\|all` | – | `{period, entries:[{user_id,name,avatar,score,rank,is_me}], me:{…,rank}, total}` (top 50) |
| GET | `/alerts?unread=1` | – | `{data:[{id, by_name, by_avatar, period, new_rank, read, created_at}]}` |
| POST | `/alerts/read` | `{ids?: string[]}` | Marks the given alerts as read, or all of them when `ids` is omitted. `{marked}` |
| GET | `/duels/opponent` | – | `{name, avatar, tps}`: a ranked player near your score, played as a ghost |
| POST | `/duels/results` | `{win, taps}` | Updates `best_duel` |
| POST | `/boss/results` | `{win, taps, level}` | Updates `best_boss` and `boss_level` |
| POST | `/support` | `{category: bug\|idea\|account\|other, message, email?}` | 201 `{data: ticket}` |

### How "someone passed you" alerts work

`App\Services\LeaderboardService::addScore()`: when a player's score goes from `old` to `new`, every player whose score is **strictly between** the two has just been overtaken. Each of them gets an `overtake_alerts` row with their new rank. Their client polls `GET /alerts?unread=1` on every heartbeat, shows a pop-up and a badge, then calls `POST /alerts/read`. To make alerts instant later, broadcast an event from `addScore()` over Laravel Reverb. The client already handles alerts as they arrive.

### Anti-cheat (basic)

`/progress/sync` clamps each delta to `GAME_MAX_TAPS_PER_SECOND` (25) × elapsed seconds, and caps coins at `base + total_earned × growth` per second (see `config/game.php`). The response sets `clamped: true` when it trims a delta. Admins can ban a player with `POST /admin/users/{id}/ban`.

## Admin (`is_admin` users only)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/characters` | All characters, including inactive ones |
| POST | `/admin/characters` | **Add a new politician.** Players get it on their next launch with no frontend deploy. Body: `{slug, name, title, bio, unlock_cost, coin_bonus, look:{skin, skinShade, robe, robeTrim, robePattern, cap, capTrim, headwear, facialHair, build, accessories[], lipstick?}, lines?, promises?, coming_soon?, sort_order?}` |
| PATCH | `/admin/characters/{id}` | Partial update |
| DELETE | `/admin/characters/{id}` | Retires the character (`is_active=false`), so existing saves keep working |
| POST | `/admin/users/{id}/ban` | `{banned: bool}` |
| GET | `/admin/support?status=open` | Paginated tickets |
| PATCH | `/admin/support/{id}` | `{status: open\|in_progress\|closed}` |

Allowed `look` values: `robePattern` stripes/dots/embroidery/zigzag · `headwear` fila/gele/okpu/zanna/bowler/beret · `facialHair` none/moustache/beard/goatee · `build` round/tall/stout · `accessories` sunglasses/bag/mic/phone/beads/passport/fan/calculator.

## Tables

`users` (+ `device_id`, `avatar`, `is_admin`, `is_banned`, `last_seen_at`) · `characters` · `player_progress` · `leaderboard_scores` (unique `user_id+period+period_key`, indexed by score) · `overtake_alerts` · `support_tickets` · `personal_access_tokens`.

Periods use `GAME_TIMEZONE` (default `Africa/Lagos`): daily key `2026-11-08`, weekly key `2026-W45`, all-time key `all`.

## Roadmap hooks

- **Real-time multiplayer duels**: Laravel Reverb channel `duel.{id}`. The client's `api.duelOpponent()` is the integration point.
- **Daily challenges from the server**: the client currently generates them from a date seed (`dailyChallenges()` in `progression.ts`).
- **Filament admin panel** on top of the admin endpoints above.

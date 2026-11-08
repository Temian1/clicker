# Codex brief: generate the game art for Rally Wahala

You are making the item, citizen and tool art for **Rally Wahala**, a Nigerian political-satire arcade game with two modes:

- **Promise Catcher.** A politician paces a rally stage throwing out **promises** (light, roads, schools, hospitals, jobs). The player catches them in a **receipt bag** to hold the politician to their word. The politician also throws **excuses and hardship** (fuel hike, new tax, "e no dey budget"), which the player must dodge.
- **Whack-a-Politician.** Politicians pop up from rally podiums. The player bonks them with a **squeaky toy hammer** to VOTE THEM OUT, but must not bonk the ordinary **citizens** who also pop up.

The politician characters already exist (`frontend/public/characters/*.webp`). **Do not regenerate them.** Your job is the 23 assets below.

Until an asset exists, the game shows an emoji instead, so you can deliver them one at a time and nothing breaks.

---

## 1. Style (apply to every image)

Match the existing character sprites:
- Bold, chunky 2D cartoon with **thick dark-brown outlines (#2a1608)**
- Flat bright colours with one soft shade, slightly glossy highlights
- Premium mobile-game look: readable at **48 px on a phone**, so one clear silhouette per item and no tiny details
- **One object per image, centred**, front or 3/4 view
- **Transparent background** if possible, otherwise a plain flat white background (the pipeline removes it)
- Square **1024 × 1024 PNG**
- No text unless listed below, no watermark, no real brand logos, no real party symbols or colours, no real people

Paste this before every item prompt:

```
Mobile game item icon, bold chunky 2D cartoon style, thick dark-brown (#2a1608) outlines,
flat bright colours with one soft shade and a small glossy highlight, single centred object,
transparent background, 1024x1024, readable at small size, no text unless specified,
no logos, no real people.
```

## 2. Asset list

Save each image as **`art-source/items/<key>.png`**. The key must match exactly; the game finds art by file name.

### Promise Catcher: promises (good, the player wants these)
Each promise is a **white speech bubble badge** with a thick outline and the icon inside, so it reads as "a promise".

| key | prompt (after the style block) |
|---|---|
| `promise-light` | White comic speech bubble containing a glowing yellow light bulb with light rays |
| `promise-roads` | White comic speech bubble containing a smooth black tarred road with a yellow centre line curving into the distance |
| `promise-schools` | White comic speech bubble containing a small cheerful school building with a stack of books |
| `promise-hospital` | White comic speech bubble containing a small clean hospital building with a red cross |
| `promise-jobs` | White comic speech bubble containing a brown office briefcase with a green tick |
| `promise-manifesto` | **Golden** speech bubble with sparkles containing a rolled scroll tied with a green-white ribbon and a red wax seal, labelled "SIGNED" (rare jackpot item) |

### Promise Catcher: excuses & hardship (bad, the player dodges these)
Each bad item sits on a **red warning burst / jagged circle** so it reads as danger at a glance.

| key | prompt |
|---|---|
| `bad-fuel` | Red jagged warning burst behind a cartoon petrol pump nozzle with a price tag showing "₦₦₦" and an upward red arrow |
| `bad-tax` | Red jagged warning burst behind a long curling paper bill stamped "NEW TAX" in red |
| `bad-excuse` | Red jagged warning burst behind a grey stormy speech bubble with a shrug emoji face and the text "NO BUDGET" |

### Promise Catcher: power-ups
Each power-up sits on a **round glowing badge**, mint-green (#7dffb8) rim.

| key | prompt |
|---|---|
| `power-megaphone` | Round mint-green badge with a red-and-white megaphone emitting sound waves (it pulls promises in) |
| `power-double` | Round mint-green badge with a big golden star and "x2" |
| `power-shield` | Round mint-green badge with a sky-blue shield bearing a small green-white-green stripe |
| `power-slow` | Round mint-green badge with a happy green tortoise |
| `power-heart` | Round mint-green badge with a shiny red heart and a "+" |

### Promise Catcher: the player's basket

| key | prompt |
|---|---|
| `receipt-bag` | Wide open woven market basket / checkered blue-red "Ghana-must-go" style bag seen from the front, open top, with a few white paper receipts sticking out. Wider than tall (about 2:1), no background |

### Whack-a-Politician

| key | prompt |
|---|---|
| `whack-hammer` | Giant **squeaky toy hammer**: soft red rubber head with yellow stripes, short yellow handle, angled 45° ready to bonk, small "SQUEAK!" motion lines. Clearly a soft toy, not a real tool or weapon |
| `whack-clock` | Chunky blue alarm clock with "+5" on the face and motion sparkles |
| `citizen-1` | Fictional everyday Nigerian woman farmer, warm smile, colourful head-tie, holding a hoe over her shoulder. Bust/upper body only, facing forward |
| `citizen-2` | Fictional everyday Nigerian mechanic, overalls, cap, wrench in hand, friendly grin. Upper body only |
| `citizen-3` | Fictional young Nigerian university student, backpack and books, excited expression. Upper body only |
| `citizen-4` | Fictional Nigerian roadside food seller / cook, apron and wooden spoon, laughing. Upper body only |
| `citizen-5` | Fictional Nigerian grandmother in a wrapper and head-tie, gentle smile. Upper body only |
| `citizen-6` | Fictional Nigerian office worker in a shirt and tie holding a phone, surprised face. Upper body only |

Citizens must be **clearly ordinary people** (no agbada, no podium, no politician look) so players instantly know not to hit them. Don't make them look like any real person.

## 3. Process

1. Generate each image with the style block plus its prompt, and save it to `art-source/items/<key>.png`.
2. Run the pipeline from the repo root:
   ```bash
   pip install pillow rembg onnxruntime   # once
   python scripts/optimize-art.py items
   ```
   It removes backgrounds, trims and centres each image, resizes to 256 × 256 WebP in `frontend/public/items/`, and rewrites `frontend/public/items/manifest.json` (the game only loads what is listed there). It also prints which keys are still missing.
3. Check it builds: `cd frontend && npm run build`.
4. Commit `frontend/public/items/*.webp` and `manifest.json`. `art-source/` is git-ignored, so the raw PNGs stay local.

## 4. Quality checklist

- [ ] All 23 keys present (the script says `manifest: 23/23`)
- [ ] Promises read as white speech bubbles, bad items as red warnings, power-ups as green badges
- [ ] Each item is recognisable at 48 px
- [ ] The hammer is obviously a soft squeaky toy
- [ ] Citizens look like ordinary fictional people, clearly different from the politicians
- [ ] Consistent outline thickness and colour style across the set and with the character sprites

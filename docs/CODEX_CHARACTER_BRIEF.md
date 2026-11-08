# Current roster direction

The user has explicitly replaced the original fictional-only direction below: the game now uses real Nigerian political figures' names and cartoon likenesses. Keep all dialogue, promises and reactions clearly invented for the game. Preserve existing IDs for saved progress. Use transparent six-pose sprite sheets in `frontend/public/characters/`, referenced through `look.spriteSheet`, with the layered SVG renderer as fallback. See `CHARACTER_PROMPTS.md` for the active cast and art layout.

---

## Archived original brief

# Codex brief: generate new characters for Tap The Politician

You are adding new politicians to a Nigerian political-satire clicker game. Read this whole file before writing code.

## Goal

Create **N new characters** (default 6) that a Nigerian player instantly recognises as **"that's a Naija politician"**. That recognition should come from attire, regional dress, rally habits, catchphrases and political behaviour, **not** from copying any one real person's face or name.

Each character is pure data. The game draws it with layered SVG (`frontend/src/components/Politician.tsx`), so you only need to add config objects. Do not add images.

## Where to write

1. **Bundled roster:** append objects to the `CHARACTERS` array in `frontend/src/game/characters.ts`, before the `coming-soon-1` entry.
2. **Backend seed data:** regenerate `backend/database/data/characters.json` from the TS file:
   ```bash
   cd tap-the-politician
   node --experimental-strip-types -e "import('./frontend/src/game/characters.ts').then(m=>require('fs').writeFileSync('backend/database/data/characters.json', JSON.stringify(m.CHARACTERS,null,2)))"
   ```
3. Verify with `cd frontend && npm run build` and `cd backend && php artisan migrate:fresh --seed && php artisan test`.

## Schema (must match `CharacterDef` in `frontend/src/game/types.ts`)

```ts
{
  id: 'kebab-case-unique',
  name: 'Title + Funny Name',        // e.g. "Hon. Constituency Project"
  title: 'Satirical office',         // e.g. "Chairman, Committee on Flag-Offs"
  bio: 'One or two funny sentences about political BEHAVIOUR.',
  unlockCost: number,                // keep increasing after the last character (last is 1_500_000): ~x2.5 each
  coinBonus: number,                 // keep increasing after the last (last is 2.2): +0.3 to +0.5 each
  look: {
    skin: '#hex', skinShade: '#hex', // a realistic range of Nigerian skin tones; shade ≈ 20% darker
    robe: '#hex', robeTrim: '#hex',
    robePattern: 'stripes' | 'dots' | 'embroidery' | 'zigzag',
    cap: '#hex', capTrim: '#hex',
    headwear: 'fila' | 'gele' | 'okpu' | 'zanna' | 'bowler' | 'beret',
    facialHair: 'none' | 'moustache' | 'beard' | 'goatee',
    build: 'round' | 'tall' | 'stout',
    accessories: Array<'sunglasses' | 'bag' | 'mic' | 'phone' | 'beads' | 'passport' | 'fan' | 'calculator'>, // max 3, max 2 hand-held
    lipstick?: '#hex',               // optional
  },
  lines?: { 0?: string[], 1?: string[], 2?: string[], 3?: string[], 4?: string[], 5?: string[] }, // per stage, in Pidgin/English
  promises?: string[],               // 3 absurd campaign promises for the Rally Boss
}
```

Stage meanings for `lines`: 0 confident · 1 "who touch me?" · 2 sweating · 3 complaining · 4 crying · 5 total meltdown.

## What makes them feel Nigerian (use these)

- **Attire by region:** Yoruba agbada + fila (`fila`, `embroidery`); Igbo isiagu-style top + red chieftaincy cap (`okpu`, `dots`/`stripes`); Northern kaftan/babban riga + embroidered cap (`zanna`, `embroidery`); women's ankara gown + gele (`gele`, `zigzag`); South-South style with a bowler hat and coral beads (`bowler` + `beads`). Spread the roster across regions and genders.
- **Party-rally colours:** bold greens, whites, reds, blues and golds. Invent the colour schemes; don't copy a real party's logo.
- **Political archetypes to satirise:** the defector who has been in every party; the "flag-off" governor whose projects never finish; the senator on long "medical leave"; the youth-leader who is 62; the aide who announces everything on X; the "stomach infrastructure" rice-sharer; the convoy-of-40-cars commissioner; the "it's the opposition's fault" spokesperson; the "I was misquoted" minister.
- **Language:** Nigerian Pidgin and English mix, e.g. "Na wetin I do?", "Una no go understand", "Na village people", "I dey come back next tenure". Keep the jokes on political behaviour, never on ethnicity, religion or tribe.

## Hard rules

- **No real people.** Do not use real politicians' names, nicknames, initials, signature phrases tied to one person, or a combination of look + role that clearly points at one living individual. Every character must be a composite archetype.
- No real party names, logos or slogans.
- No claims of specific real crimes. The satire is generic, cartoon behaviour (padding budgets, flag-offs, big bags).
- Slapstick only: no blood, injury, weapons or violence.
- No ethnic, religious or regional mockery. The joke is always politicians, never Nigerians.

## Example (follow this quality bar)

```ts
{
  id: 'hon-cross-carpet',
  name: 'Hon. Cross-Carpet',
  title: 'Member of Every Party Since 1999',
  bio: 'Has defected so many times his agbada has four different party colours sewn together.',
  unlockCost: 3_750_000,
  coinBonus: 2.6,
  look: {
    skin: '#7a4a1c', skinShade: '#5a3412',
    robe: '#2e7d32', robeTrim: '#c62828', robePattern: 'stripes',
    cap: '#1565c0', capTrim: '#fdd835', headwear: 'fila',
    facialHair: 'moustache', build: 'round',
    accessories: ['sunglasses', 'phone'],
  },
  lines: {
    0: ['My party is the people! …which party are we in today?'],
    3: ['I never defected! I just… relocated ideologically!'],
    5: ['WHICH PARTY GO SAVE ME NOW?!'],
  },
  promises: ['Free party membership cards for everybody!', 'I will defect TO you!', 'Dual citizenship for parties!'],
}
```

## Deliverables

1. N new character objects in `characters.ts`, each with all fields, 2+ lines for stages 0, 3 and 5, and 3 promises.
2. Regenerated `characters.json`.
3. A green build and passing tests.
4. Optionally, a matching art prompt for each character appended to `docs/CHARACTER_PROMPTS.md`, using the template in that file.

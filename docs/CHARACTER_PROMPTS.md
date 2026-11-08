# Character art prompts (for ChatGPT / DALL·E or any image model)

The game already ships with **code-drawn, layered SVG characters** (`frontend/src/components/Politician.tsx`). Every part (robe, cap, glasses, eyes, mouth, sweat, tears, props) animates on its own, so the game needs no images to run.

Use these prompts when you want **illustrated art** for marketing, the app icon, store screenshots, or as a reference for a designer redrawing the SVG layers. Paste the **style block** first, then one character block.

> **Content rule:** every character is a *fictional* caricature. Do not name, describe or resemble a real politician. Keep it slapstick: no blood, injury or violence, and no ethnic or religious mockery. The jokes target political behaviour (promises, budgets, bags), not people's cultures.

---

## 1. Style block (paste first, every time)

```
Cartoon character design sheet for a mobile clicker game called "Tap The Politician".
Style: bold, chunky 2D cartoon with thick dark-brown outlines (#2a1608), flat colours with one soft
shade, big head (≈40% of height), small body, expressive eyebrows, rounded shapes, like a premium
mobile game mascot. Plain transparent background. Full body, front view, centred, feet visible.
Fictional character, not based on any real person. Family-friendly slapstick comedy.
Produce ONE image showing 6 poses side by side, same character, labelled 1–6:
1 "Fresh Agbada" – confident smile with teeth, perfectly ironed outfit, cap straight
2 "Who Touch Me?" – surprised wide eyes, sunglasses shaking, awkward wavy smile
3 "Sweating Small" – sweat drops, cap tilted, gritted-teeth nervous grin
4 "Abeg, Na Wetin I Do?" – angry complaining open mouth, wrinkled outfit, sunglasses slid down nose
5 "Cartoon Tears" – eyes squeezed shut, streams of comic tears, wailing mouth, outfit very rumpled
6 "Wahala Don Land" – total meltdown: dizzy spiral eyes, screaming, cap flying off, steam puffs,
  patch on the outfit, props bursting
```

## 2. Character blocks

### Chief Promise Plenty: *Professional Promiser* (starter)
```
Character: round-bodied man, warm brown skin (#8d5524), thick moustache, black sunglasses.
Outfit: white-cream flowing agbada (#f4f1e8) with gold embroidery (#d4a017) around the neck and chest.
Headwear: soft gold fila cap folded to one side. Prop: white horsetail fly-whisk (irukere) in his left hand.
Personality: overconfident, always promising "24-hour light by 2099".
```

### Hon. Mama Dividends: *Minister of Owambe Affairs* (5K coins)
```
Character: stout woman, brown skin (#a0662d), bold magenta lipstick, coral bead necklace.
Outfit: purple ankara gown (#8e2de2) with orange zig-zag pattern (#ff9f1c).
Headwear: huge, dramatic orange gele head-tie with pleats. Prop: smartphone in her right hand.
Personality: shares "dividends of democracy" in tiny nylon bags, obsessed with her gele.
```

### Senator Bag Hustle: *Chairman, Committee on Big Bags* (25K)
```
Character: tall man, dark brown skin (#6b3e18), goatee, sunglasses.
Outfit: green agbada (#1e7f4f) with white vertical stripes.
Headwear: red chieftaincy cap with gold dots and a black tassel.
Prop: blue-and-red checkered "Ghana-Must-Go" bag in his right hand (in stage 6 paper slips fly out).
Personality: insists the bag only holds "constituency documents".
```

### Alhaji Budget Padding: *Grand Commissioner of Arithmetic* (100K)
```
Character: round man, light-brown skin (#c68642), full neat beard, prayer-bead-style necklace.
Outfit: royal blue kaftan (#1565c0) with pale-blue embroidery.
Headwear: tall, rounded embroidered cap, pale blue with blue zig-zag stitching.
Prop: grey calculator (in stage 6 it smokes). Personality: turns ₦1,000 into ₦1 billion on paper.
```

### Governor Light-Off: *His Excellency of Generators* (400K)
```
Character: stout man, brown skin (#7a4a1c), moustache, sunglasses.
Outfit: orange agbada (#ef6c00) with black polka dots.
Headwear: black bowler hat with an orange band. Prop: handheld microphone raised mid-speech.
Personality: commissioned the same transformer seven times.
```

### Prince Medical Abroad: *Ambassador of Checkups* (1.5M)
```
Character: tall man, brown skin (#9a5b2e), short beard, sunglasses.
Outfit: deep purple agbada (#4a148c) with gold embroidery (#ffd700).
Headwear: gold beret with a small star emblem. Prop: green passport held up.
Personality: runs everything by video call from a hospital "abroad".
```

### Template for new characters
```
Character: [build: round / tall / stout], [skin tone hex], [facial hair], [glasses?].
Outfit: [colour hex] [agbada / kaftan / gown] with [stripes / dots / embroidery / zig-zag] in [trim hex].
Headwear: [fila / gele / red chieftaincy cap / embroidered cap / bowler / beret] in [hex].
Prop: [bag / mic / phone / passport / calculator / fly-whisk / beads].
Personality: [one-line satirical joke about political behaviour].
```
Then add the same values as a `look` object through `POST /api/admin/characters`. The game draws the new character immediately.

## 3. Extra assets to generate

```
App icon: square, rounded corners, Nigerian green-white-green background, close-up of a cartoon
politician face with gold cap and sunglasses, a big tapping finger touching his cheek, comic
"TAP!" burst. Same thick-outline style. No text other than "TAP!".
```
```
WhatsApp share banner 1200×630: the six fictional politicians lined up on a rally stage, each
at a different meltdown stage, confetti, gold coins, title "TAP THE POLITICIAN" in chunky yellow
letters with dark outline.
```

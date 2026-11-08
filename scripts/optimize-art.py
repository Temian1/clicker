"""
Rally Wahala art pipeline: turns Codex-generated PNGs into game-ready WebP.

  art-source/items/<asset-key>.png       ->  frontend/public/items/<asset-key>.webp  (+ manifest.json)
  art-source/characters/<slug>.png       ->  frontend/public/characters/<slug>.webp  (3x2 pose sheets)

Usage (from the repo root):
  python scripts/optimize-art.py              # items + characters
  python scripts/optimize-art.py items        # only items
  python scripts/optimize-art.py characters   # only character sheets

Backgrounds are removed automatically with rembg (isnet-anime) when an image
has no transparency. Requires: pip install pillow rembg onnxruntime
"""

import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_ITEMS = ROOT / "art-source" / "items"
SRC_CHARS = ROOT / "art-source" / "characters"
OUT_ITEMS = ROOT / "frontend" / "public" / "items"
OUT_CHARS = ROOT / "frontend" / "public" / "characters"
ASSETS_TS = ROOT / "frontend" / "src" / "game" / "assets.tsx"

ITEM_SIZE = 256          # every item is a 256x256 transparent square
SHEET_SIZE = (1200, 800)  # character sheets: 3 cols x 2 rows of 400x400

_session = None


def cutout(img: Image.Image) -> Image.Image:
    """Remove the background unless the image already has real transparency."""
    img = img.convert("RGBA")
    alpha = img.getchannel("A")
    if alpha.getextrema()[0] < 250:  # already has transparent pixels
        return img
    global _session
    from rembg import new_session, remove  # imported lazily: heavy

    if _session is None:
        _session = new_session("isnet-anime")
    return remove(img, session=_session, post_process_mask=True)


def square(img: Image.Image, size: int) -> Image.Image:
    """Trim transparent margins, then centre on a square canvas with padding."""
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    side = int(max(img.size) * 1.08)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


def known_keys() -> set[str]:
    text = ASSETS_TS.read_text(encoding="utf-8")
    block = text[text.index("export const ASSETS") : text.index("} as const")]
    return set(re.findall(r"'([a-z0-9-]+)':", block))


def do_items() -> None:
    OUT_ITEMS.mkdir(parents=True, exist_ok=True)
    keys = known_keys()
    if SRC_ITEMS.exists():
        for p in sorted(SRC_ITEMS.glob("*.png")):
            if p.stem not in keys:
                print(f"  ! skipping {p.name}: not an asset key in assets.tsx")
                continue
            out = OUT_ITEMS / f"{p.stem}.webp"
            square(cutout(Image.open(p)), ITEM_SIZE).save(out, "WEBP", quality=88, method=6)
            print(f"  item  {out.name:28s} {out.stat().st_size // 1024} KB")
    present = sorted(k for k in keys if (OUT_ITEMS / f"{k}.webp").exists())
    (OUT_ITEMS / "manifest.json").write_text(json.dumps(present, indent=2), encoding="utf-8")
    missing = sorted(keys - set(present))
    print(f"manifest: {len(present)}/{len(keys)} assets present")
    if missing:
        print("  still using emoji for: " + ", ".join(missing))


def do_characters() -> None:
    if not SRC_CHARS.exists():
        return
    OUT_CHARS.mkdir(parents=True, exist_ok=True)
    for p in sorted(SRC_CHARS.glob("*.png")):
        im = Image.open(p).convert("RGB")
        w, h = im.size
        cw, ch = w // 3, h // 2
        sheet = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        for i in range(6):
            box = ((i % 3) * cw, (i // 3) * ch, (i % 3 + 1) * cw, (i // 3 + 1) * ch)
            sheet.paste(cutout(im.crop(box)), box[:2])
        out = OUT_CHARS / f"{p.stem}.webp"
        sheet.resize(SHEET_SIZE, Image.LANCZOS).save(out, "WEBP", quality=85, method=6)
        print(f"  sheet {out.name:28s} {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    if what in ("all", "items"):
        do_items()
    if what in ("all", "characters"):
        do_characters()

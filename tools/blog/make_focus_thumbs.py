#!/usr/bin/env python3
"""
Focus-of-the-Day thumbnail builder — Orr Biologicals
====================================================

Creates four distinct, high-quality 1600x900 thumbnails used by the blog's
rotating shelf for the daily focus card. Each is derived from the site's own
photography (real lab / microscopy imagery) with a brand treatment: gentle
green duotone lift, vignette, and a soft vignette caption bar. Deterministic
and offline — regenerate with:

    python tools/blog/make_focus_thumbs.py

Outputs to assets/images/focus/focus-0.jpg .. focus-3.jpg
"""

from pathlib import Path
from PIL import Image, ImageEnhance, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "images" / "focus"
SIZE = (1600, 900)

# source photography already in the repo (real imagery, not stock)
SOURCES = [
    ROOT / "assets" / "images" / "microscopy" / "sim-field.jpg",   # dark-field filaments
    ROOT / "assets" / "images" / "hero.jpg",                        # the green column
    ROOT / "assets" / "images" / "microscopy" / "bench-photo.jpg",  # control brick
    ROOT / "assets" / "cyano" / "hero-field.jpg",                   # single-cell field
]

LEAF = (63, 143, 78)       # brand green
CREAM = (250, 246, 236)    # brand paper


def crop_cover(im: Image.Image, size=SIZE) -> Image.Image:
    return ImageOps.fit(im, size, method=Image.LANCZOS, centering=(0.5, 0.42))


def green_lift(im: Image.Image, strength=0.18) -> Image.Image:
    """Blend a subtle brand-green duotone into the midtones."""
    gray = ImageOps.grayscale(im)
    tinted = ImageOps.colorize(gray, black=(6, 16, 10), white=(226, 244, 224), mid=LEAF)
    return Image.blend(im.convert("RGB"), tinted, strength)


def vignette(im: Image.Image, strength=90) -> Image.Image:
    mask = Image.new("L", SIZE, 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((-SIZE[0] * 0.25, -SIZE[1] * 0.35, SIZE[0] * 1.25, SIZE[1] * 1.35), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(180))
    dark = Image.new("RGB", SIZE, (8, 14, 9))
    return Image.composite(im, dark, mask)


def caption_bar(im: Image.Image) -> Image.Image:
    """Soft bottom gradient so overlay text (added by the card) stays readable."""
    grad = Image.new("L", SIZE, 0)
    d = ImageDraw.Draw(grad)
    for y in range(int(SIZE[1] * 0.62), SIZE[1]):
        a = int(150 * ((y - SIZE[1] * 0.62) / (SIZE[1] * 0.38)) ** 1.4)
        d.line([(0, y), (SIZE[0], y)], fill=a)
    overlay = Image.new("RGB", SIZE, (10, 16, 11))
    return Image.composite(overlay, im, grad)


def build(src: Path, idx: int) -> None:
    im = Image.open(src).convert("RGB")
    im = crop_cover(im)
    im = green_lift(im, strength=(0.14, 0.2, 0.12, 0.16)[idx % 4])
    im = vignette(im)
    im = caption_bar(im)
    im = ImageEnhance.Sharpness(im).enhance(1.06)
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"focus-{idx}.jpg"
    im.save(out, "JPEG", quality=86, optimize=True, progressive=True)
    print(f"wrote {out.relative_to(ROOT)}  ({out.stat().st_size // 1024} KB)")


def main() -> int:
    for i, src in enumerate(SOURCES):
        if not src.exists():
            print(f"skip (missing): {src}")
            continue
        build(src, i)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

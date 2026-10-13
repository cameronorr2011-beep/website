"""Bake original, seeded pixel-art biome plates. No network or runtime generation.

Run: python tools/build_field_art.py (Pillow). Art is covered by the repo license.
The transparent foreground is separate for in-game parallax and depth.
"""
from pathlib import Path
import math
import random
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "game" / "assets"
W, H = 960, 540


def mix(a, b, t):
    return tuple(int(x + (y - x) * t) for x, y in zip(a, b))


def plate(name, seed, top, bottom, stone, plants, accents):
    r = random.Random(seed)
    im = Image.new("RGB", (W, H))
    px = im.load()
    for y in range(H):
        for x in range(W):
            base = mix(top, bottom, (y / H) ** .7)
            light = max(0, 1 - math.hypot((x - 480) / 650, y / 700)) * 10
            noise = r.choice([-2, -1, 0, 0, 1, 2])
            px[x, y] = tuple(max(0, min(255, int(c + light + noise))) for c in base)
    d = ImageDraw.Draw(im)
    # High, broken water-surface reflections.
    for i in range(400):
        x, y = r.randrange(W), r.randrange(75)
        c = mix(top, (190, 244, 220), r.uniform(.05, .32) * (1 - y / 90))
        d.line((x, y, x + r.randrange(5, 55), y), fill=c, width=r.choice([1, 1, 2]))
    rays = Image.new("RGBA", im.size)
    rd = ImageDraw.Draw(rays)
    for x, width in [(130, 65), (215, 18), (470, 60), (555, 12), (700, 25)]:
        rd.polygon([(x, 0), (x + width, 0), (x + width + 210, H), (x + 140, H)], fill=(183, 241, 203, 14))
    im = Image.alpha_composite(im.convert("RGBA"), rays.filter(ImageFilter.GaussianBlur(5))).convert("RGB")
    d = ImageDraw.Draw(im)

    def rock(draw, cx, base, rw, rh, color, detail=1):
        points = [(cx - rw, base), (cx - rw * .9, base - rh * .43),
                  (cx - rw * .55, base - rh * .86), (cx - rw * .16, base - rh),
                  (cx + rw * .49, base - rh * .81), (cx + rw * .83, base - rh * .38), (cx + rw, base)]
        draw.polygon(points, fill=color)
        draw.polygon([points[0], points[2], points[3], (cx, base - rh * .37), (cx - rw * .19, base)], fill=mix(color, (143, 186, 157), .17))
        draw.polygon([points[3], points[4], points[5], points[6], (cx + rw * .16, base - rh * .24)], fill=mix(color, (2, 14, 25), .22))
        # Sedimentary ledges, textured faces and tiny lit edges.
        for j in range(int(rh * detail)):
            yy = base - r.uniform(5, rh * .85)
            xx = cx + r.uniform(-rw * .65, rw * .65)
            color2 = mix(color, (162, 202, 158) if j % 3 else (3, 16, 28), r.uniform(.07, .33))
            draw.line((xx, yy, xx + r.uniform(2, rw * .21), yy), fill=color2, width=r.choice([1, 1, 2]))

    def grass(draw, x, y, height, color, branches=6):
        for j in range(branches):
            h = height * r.uniform(.45, 1.1)
            sway = r.uniform(-h * .4, h * .4)
            pts = [(x + math.sin(k / 9 + j) * k * .12 + sway * (k / h) ** 2, y - k)
                   for k in range(0, int(h), 3)]
            if len(pts) < 2:
                continue
            draw.line(pts, fill=color, width=max(1, int(h / 30)))
            for k in range(8, int(h), 10):
                xx, yy = pts[min(len(pts) - 1, k // 3)]
                s = 1 if (k // 10 + j) % 2 else -1
                leaf = [(xx, yy), (xx + s * h / 8, yy - h / 12), (xx + s * h / 11, yy + 2)]
                draw.polygon(leaf, fill=mix(color, (162, 223, 155), .17))

    def coral(draw, x, y, size, color, depth=4, angle=-math.pi / 2):
        end = (x + math.cos(angle) * size, y + math.sin(angle) * size)
        draw.line((x, y, *end), fill=color, width=max(1, depth + 1))
        draw.line((x - 1, y, end[0] - 1, end[1]), fill=mix(color, (255, 218, 156), .3), width=max(1, depth // 2))
        if depth:
            for delta in [-.53, .42]:
                coral(draw, *end, size * r.uniform(.58, .78), color, depth - 1, angle + delta + r.uniform(-.12, .12))
        else:
            draw.ellipse((end[0] - 2, end[1] - 2, end[0] + 2, end[1] + 2), fill=mix(color, (255, 239, 169), .45))

    # Layered rock shelves recede into blue/green atmospheric haze.
    for layer in range(3):
        base = 385 + layer * 56
        color = mix(bottom, stone, .22 + layer * .25)
        for x in range(-40, W + 80, 65):
            depth = abs(x - W / 2) / (W / 2)
            height = r.uniform(18, 60) + depth * (52 + layer * 40)
            rock(d, x + r.uniform(-25, 25), base, r.uniform(45, 105), height, color, .6)
    # A lit sand channel leads the eye to the center rather than a flat platform.
    floor = []
    for x in range(0, W + 8, 8):
        y = 475 - abs(x - W / 2) * .1 + math.sin(x / 80) * 13
        floor.append((x, y))
    d.polygon(floor + [(W, H), (0, H)], fill=mix(stone, (36, 90, 90), .5))
    for i in range(2600):
        x, y = r.randrange(W), r.randrange(450, H)
        color = mix(stone, (167, 196, 146), r.uniform(.05, .42))
        d.line((x, y, x + r.randrange(1, 7), y), fill=color)

    if name == "marsh":
        # Mangrove trunks/root arches, reeds, cattails and floating lily pads.
        for x in [55, 185, 785, 918]:
            bark = (35, 65, 47)
            d.polygon([(x-18, 0), (x+16, 0), (x+5, 265), (x+43, 454), (x+22, 454), (x-8, 326), (x-48, 467), (x-62, 467), (x-23, 257)], fill=bark)
            for i in range(60):
                y = r.randrange(380)
                xx = x + r.randrange(-14, 10)
                d.line((xx, y, xx + r.randrange(-2, 4), y + r.randrange(7, 38)), fill=(62, 91, 54))
        for i in range(20):
            x, y = r.randrange(W), r.randrange(60, 155)
            d.ellipse((x - 30, y - 3, x + 30, y + 5), fill=(106, 149, 67))
            d.line((x, y + 3, x + 5, y + 85), fill=(67, 109, 64))
    elif name == "thermal":
        for x, height in [(165, 150), (790, 194), (856, 140)]:
            rock(d, x, 490, 34, height, (49, 46, 59), 2)
            d.ellipse((x - 17, 488 - height, x + 12, 499 - height), fill=(246, 157, 70))
            for j in range(95):
                y = 480 - height - j * 2
                xx = x + math.sin(j / 13) * 14
                d.ellipse((xx - j * .2 - 6, y - 3, xx + j * .2 + 6, y + 3), fill=mix(bottom, (113, 120, 125), .5 - j / 250))
    elif name == "night":
        for x, y, size in [(185, 210, 24), (790, 190, 17), (700, 125, 10)]:
            d.pieslice((x-size, y-size, x+size, y+size), 180, 360, fill=(130, 166, 201))
            d.arc((x-size, y-size, x+size, y+size), 180, 360, fill=(199, 229, 249), width=2)
            for j in range(5):
                xx = x - size + j * size / 2
                d.line([(xx + math.sin(k / 7 + j) * 5, y + k) for k in range(size * 3)], fill=(125, 110, 169), width=1)

    for i in range(95):
        x = r.randrange(W)
        y = int(475 - abs(x - W / 2) * .10 + r.uniform(-30, 48))
        if abs(x - 480) < 210 and i % 4:
            continue
        grass(d, x, y, r.randrange(20, 115), r.choice(plants), r.randrange(3, 7))
    for i in range(27):
        x = r.choice([r.randrange(15, 350), r.randrange(660, 940)])
        y = r.randrange(420, 520)
        coral(d, x, y, r.uniform(8, 23), r.choice(accents), r.choice([2, 3, 4]))
    for i in range(280):
        x, y = r.randrange(W), r.randrange(H)
        d.point((x, y), fill=mix(bottom, (176, 225, 217), r.uniform(.12, .4)))
    # Transparent foreground is oversized and moves independently in the renderer.
    fg = Image.new("RGBA", (W, H))
    fd = ImageDraw.Draw(fg)
    for x in [-20, 25, 900, 963]:
        rock(fd, x, 568, 75, r.randrange(85, 150), mix(stone, (0, 9, 20), .62), .7)
        grass(fd, x + r.randrange(-10, 20), 568, r.randrange(160, 270), mix(plants[0], (0, 9, 20), .48), 7)
    for x in [65, 125, 820, 920]:
        coral(fd, x, 559, r.randrange(16, 29), mix(accents[0], (0, 9, 20), .4), 4)
    im.save(OUT / f"{name}-scene.webp", quality=94, method=6)
    fg.save(OUT / f"{name}-foreground.webp", lossless=True, method=6)
    print(f"Baked {name}: background + foreground ({W}×{H})")


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    plate("ocean", 41, (25, 136, 169), (5, 36, 62), (38, 95, 99), [(29, 136, 108), (60, 167, 129), (36, 112, 126)], [(229, 117, 106), (235, 172, 101), (131, 110, 176)])
    plate("marsh", 63, (92, 147, 111), (17, 49, 46), (60, 86, 53), [(75, 140, 69), (104, 155, 73), (42, 102, 77)], [(189, 167, 86), (107, 146, 83), (129, 151, 90)])
    plate("thermal", 87, (33, 68, 95), (19, 23, 39), (72, 67, 75), [(116, 80, 73), (94, 81, 84), (128, 108, 91)], [(230, 123, 74), (188, 86, 87), (218, 167, 92)])
    plate("night", 107, (24, 38, 78), (7, 12, 32), (43, 40, 72), [(70, 111, 147), (86, 94, 161), (43, 137, 137)], [(127, 146, 201), (92, 200, 196), (173, 127, 202)])

"""Create reproducible CultureTrace PNG, ICO, and ICNS assets without a binary dependency."""
from pathlib import Path
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "assets" / "icons"

def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)

def png(size, poster=False):
    width, height = ((1200, 630) if poster else (size, size))
    rows = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            if poster:
                dx, dy = x - 260, y - 315
                base = (12, 39, 31) if dx * dx + dy * dy < 360000 else (244, 247, 241)
                inside = dx * dx + dy * dy < 14500
                ring = 14500 < dx * dx + dy * dy < 19000
                trace = abs(y - (390 - int((x - 80) * .25))) < 6 and 90 < x < 510
                gold = (x - 155) ** 2 + (y - 390) ** 2 < 260 or (x - 452) ** 2 + (y - 270) ** 2 < 260
                if inside: base = (23, 72, 59)
                if ring: base = (167, 217, 197)
                if trace: base = (95, 226, 192)
                if gold: base = (241, 201, 132)
            else:
                cx = cy = size / 2
                scale = size / 512
                dx, dy = x - cx, y - cy
                base = (15, 48, 40)
                if dx * dx + dy * dy < (140 * scale) ** 2: base = (167, 217, 197)
                if dx * dx + dy * dy < (116 * scale) ** 2: base = (15, 48, 40)
                curve_y = 322 * scale - (x - 92 * scale) * .25
                trace = 92 * scale < x < 460 * scale and abs(y - curve_y) < 7 * scale
                gold = ((x - 123 * scale) ** 2 + (y - 320 * scale) ** 2 < (24 * scale) ** 2 or
                        (x - 420 * scale) ** 2 + (y - 225 * scale) ** 2 < (24 * scale) ** 2)
                if trace: base = (95, 226, 192)
                if gold: base = (241, 201, 132)
            row.extend(bytes(base) + bytes([255]))
        rows.append(bytes(row))
    raw = b"".join(rows)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")

def ico(images):
    header = struct.pack("<HHH", 0, 1, len(images))
    offset = 6 + 16 * len(images)
    entries, payload = [], []
    for size, data in images:
        dimension = 0 if size >= 256 else size
        entries.append(struct.pack("<BBBBHHII", dimension, dimension, 0, 0, 1, 32, len(data), offset))
        payload.append(data); offset += len(data)
    return header + b"".join(entries) + b"".join(payload)

def icns(images):
    chunks = []
    for tag, data in images:
        chunks.append(tag + struct.pack(">I", len(data) + 8) + data)
    body = b"".join(chunks)
    return b"icns" + struct.pack(">I", len(body) + 8) + body

ICON_DIR.mkdir(parents=True, exist_ok=True)
for size in (16, 32, 48, 180, 192, 256, 512):
    (ICON_DIR / f"culturetrace-{size}.png").write_bytes(png(size))
for size in (16, 32, 48, 128, 256, 512):
    directory = ICON_DIR / str(size)
    directory.mkdir(exist_ok=True)
    (directory / "culturetrace.png").write_bytes(png(size))
(ICON_DIR / "culturetrace.ico").write_bytes(ico([(size, png(size)) for size in (16, 32, 48, 256)]))
(ICON_DIR / "culturetrace.icns").write_bytes(icns([(tag, png(size)) for tag, size in ((b"ic07", 128), (b"ic08", 256), (b"ic09", 512))]))
(ROOT / "public" / "favicon.ico").write_bytes(ico([(size, png(size)) for size in (16, 32, 48, 256)]))
(ROOT / "public" / "favicon-16.png").write_bytes(png(16))
(ROOT / "public" / "favicon-32.png").write_bytes(png(32))
(ROOT / "public" / "apple-touch-icon.png").write_bytes(png(180))
(ROOT / "public" / "culturetrace-192.png").write_bytes(png(192))
(ROOT / "public" / "culturetrace-512.png").write_bytes(png(512))
(ROOT / "public" / "culturetrace-og.png").write_bytes(png(1200, poster=True))
print("Generated CultureTrace icon set")

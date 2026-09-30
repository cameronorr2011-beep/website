#!/usr/bin/env python3
"""One-off repair of double-encoded (mojibake) text in blog articles.

The blog HTML files were saved at some point with their UTF-8 bytes
re-encoded as cp1252 characters (em dash -> "â€”", degree sign ->
"Â°C", ...). This script walks each file byte-wise and, wherever a
run of cp1252 characters forms a valid reversed mojibake sequence,
decodes it back to the original character. Valid UTF-8 elsewhere is
touched only where it is itself a mojibake prefix (e.g. a lone
U+00C2 followed by a bare control byte), which is exactly what the
reader sees as garbage today.

Usage: python tools/fix_mojibake.py            # repair in place
       python tools/fix_mojibake.py --dry-run  # report only
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = sorted((ROOT / "blog").glob("*.html"))

# cp1252 mapping for bytes 0x80-0x9F (the ones UTF-8 continuations map to)
CP1252 = {
    0x80: "\u20ac", 0x82: "\u201a", 0x83: "\u0192", 0x84: "\u201e",
    0x85: "\u2026", 0x86: "\u2020", 0x87: "\u2021", 0x88: "\u02c6",
    0x89: "\u2030", 0x8a: "\u0160", 0x8b: "\u2039", 0x8c: "\u0152",
    0x8e: "\u017d", 0x91: "\u2018", 0x92: "\u2019", 0x93: "\u201c",
    0x94: "\u201d", 0x95: "\u2022", 0x96: "\u2013", 0x97: "\u2014",
    0x98: "\u02dc", 0x99: "\u2122", 0x9a: "\u0161", 0x9b: "\u203a",
    0x9c: "\u0153", 0x9e: "\u017e", 0x9f: "\u0178",
}
# reverse: character -> original byte (for cp1252-representable chars)
REV = {}
for b in range(0x20, 0x100):
    ch = CP1252.get(b, chr(b))
    REV.setdefault(ch, b)


def repair(text: str) -> tuple[str, int]:
    """cp1252-decode mojibake runs inside a (mostly valid) UTF-8 string."""
    out = []
    i = 0
    fixed = 0
    n = len(text)
    while i < n:
        ch = text[i]
        cp = ord(ch)
        # Candidate mojibake lead byte: U+0080-U+00FF (cp1252 range)
        if 0x80 <= cp <= 0xFF:
            chunk = []
            j = i
            while j < n:
                c2 = text[j]
                o2 = ord(c2)
                # cp1252-visible lead/continuation bytes: latin-1 range,
                # cp1252 punctuation (EUR/quotes/dashes, all in REV),
                # and bare C1 controls left by partial earlier fixes
                if (0x80 <= o2 <= 0x9F) or (o2 >= 0x80 and c2 in REV):
                    chunk.append(o2)
                    j += 1
                else:
                    break
            # Try progressively longer runs; accept the longest that
            # round-trips to valid UTF-8.
            best = None
            for end in range(len(chunk), 1, -1):
                b = bytes(REV.get(chr(o), 0x3F if o > 0xFF else o) for o in chunk[:end])
                try:
                    dec = b.decode("utf-8")
                except UnicodeDecodeError:
                    continue
                # must not decode to something that still looks like mojibake
                if any(0x80 <= ord(c) <= 0x9F for c in dec):
                    continue
                best = (end, dec)
                break
            if best:
                end, dec = best
                out.append(dec)
                fixed += end
                i += end
                continue
        out.append(ch)
        i += 1
    return "".join(out), fixed


def main() -> int:
    dry = "--dry-run" in sys.argv
    total = 0
    for f in TARGETS:
        txt = f.read_text(encoding="utf-8")
        new, fixed = repair(txt)
        if fixed:
            print(f"{f.name}: {fixed} bytes repaired")
            if not dry:
                f.write_text(new, encoding="utf-8", newline="")
        total += fixed
    print(f"total repaired bytes: {total}" + ("  (dry run, nothing written)" if dry else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())

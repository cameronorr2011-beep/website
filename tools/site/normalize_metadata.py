"""One-time/idempotent SEO normalization, no fabricated scientific metadata."""
import html
import re
import struct
from pathlib import Path
from urllib.parse import urlsplit
from seo_audit import ROOT, Page, pages


def dimensions(path):
    if path.suffix == '.svg':
        text = path.read_text(encoding='utf-8')
        match = re.search(r'viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"', text)
        return tuple(int(float(x)) for x in match.groups()) if match else None
    if path.suffix.lower() not in ('.jpg', '.jpeg'): return None
    data = path.read_bytes(); i = 2
    while i < len(data):
        if data[i] != 255: return None
        while data[i] == 255: i += 1
        marker = data[i]; i += 1
        if marker in (0xD8, 0xD9): continue
        size = struct.unpack('>H', data[i:i+2])[0]
        if marker in (0xC0, 0xC1, 0xC2):
            h, w = struct.unpack('>HH', data[i+3:i+7]); return w, h
        i += size
    return None


def build():
    for path in pages():
        text = path.read_text(encoding='utf-8-sig'); page = Page(text)
        if 'noindex' in page.robots: continue
        if path == ROOT / 'blog/index.html':
            text = re.sub(r'<title>.*?</title>', '<title>Algae Cultivation Guides &amp; Research Notes | Orr Biologicals</title>', text, count=1)
            text = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Explore Spirulina cultivation, algae sensors, digital twins and single-cell imaging guides, plus clearly labeled AI-assisted research summaries.">', text, count=1)
        page = Page(text)
        values = {'og:title': page.title, 'og:description': page.description,
                  'og:url': page.canonical, 'og:site_name': 'Orr Biologicals',
                  'og:image': page.meta.get('og:image', 'https://orrbiologicals.com/assets/og.png'),
                  'twitter:card': 'summary_large_image', 'twitter:title': page.title,
                  'twitter:description': page.description,
                  'twitter:image': page.meta.get('og:image', 'https://orrbiologicals.com/assets/og.png')}
        for key, value in values.items():
            attr = 'property' if key.startswith('og:') else 'name'
            tag = '<meta ' + attr + '="' + key + '" content="' + html.escape(value, quote=True) + '">'
            pattern = r'<meta (?:name|property)="' + re.escape(key) + '" content="[^"]*">'
            if re.search(pattern, text): text = re.sub(pattern, lambda _: tag, text)
            else: text = text.replace('</head>', tag + '\n</head>', 1)
        if path == ROOT / 'cyanoflow.html':
            text = re.sub(r'<link rel="icon"[^>]*>', '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">', text, count=1)
        def image(match):
            tag = match.group(0)
            src = re.search(r'src="([^"]*)"', tag)
            if not src or not src.group(1): return tag
            parsed = urlsplit(src.group(1))
            if parsed.scheme or parsed.netloc: return tag
            asset = ROOT / parsed.path.lstrip('/') if parsed.path.startswith('/') else path.parent / parsed.path
            if not asset.exists(): return tag
            size = dimensions(asset)
            if size:
                if not re.search(r'\bwidth=', tag): tag = tag[:-1] + f' width="{size[0]}">'
                if not re.search(r'\bheight=', tag): tag = tag[:-1] + f' height="{size[1]}">'
            hero = path == ROOT / 'index.html' and 'src="assets/images/hero.jpg"' in tag and 'loading=' not in tag
            if hero and 'fetchpriority=' not in tag: tag = tag[:-1] + ' fetchpriority="high" decoding="async">'
            elif path == ROOT / 'index.html' and 'loading=' not in tag: tag = tag[:-1] + ' loading="lazy" decoding="async">'
            return tag
        text = re.sub(r'<img\b[^>]*>', image, text)
        path.write_text(text, encoding='utf-8')
    # The partial head is historical context only, but must not advertise offers.
    home = (ROOT / 'index.html').read_text(encoding='utf-8')
    head = home[:home.index('  <link rel="stylesheet" href="css/')].rstrip()
    (ROOT / 'sections/head.html').write_text(head + '\n', encoding='utf-8')
    print('Normalized actual page/social metadata and local image sizes')


if __name__ == '__main__': build()

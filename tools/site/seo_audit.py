"""SEO inventory and read-only HTTP checks. No credentials or third-party APIs.
python tools/site/seo_audit.py --out docs/seo/baseline --live
"""
import argparse
import concurrent.futures
import csv
import json
import re
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[2]
SITE = 'https://orrbiologicals.com'


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.title = ''; self.description = ''; self.canonical = ''; self.robots = ''
        self.headings = {n: [] for n in ('h1', 'h2', 'h3')}
        self.links = []; self.images = []; self.ids = []; self.schemas = []
        self.meta = {}; self.text = []; self.capture = None; self.buffer = []
        self.skip = 0; self.jsonld = False; self.schema_errors = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag == 'meta':
            key = a.get('name', a.get('property', ''))
            self.meta[key] = a.get('content', '')
            if key in ('description', 'robots'): setattr(self, key, a.get('content', ''))
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical = a.get('href', '')
        if tag == 'a' and a.get('href'): self.links.append(a['href'])
        if tag == 'img': self.images.append(a)
        if tag in ('title', 'h1', 'h2', 'h3'):
            self.capture = tag; self.buffer = []
        if tag in ('script', 'style'):
            self.skip += 1
            if tag == 'script' and a.get('type') == 'application/ld+json':
                self.jsonld = True; self.buffer = []

    def handle_data(self, data):
        if self.capture or self.jsonld: self.buffer.append(data)
        if not self.skip: self.text.append(data)

    def handle_endtag(self, tag):
        if tag == self.capture:
            value = re.sub(r'\s+', ' ', ''.join(self.buffer)).strip()
            if tag == 'title': self.title = value
            else: self.headings[tag].append(value)
            self.capture = None; self.buffer = []
        if tag == 'script' and self.jsonld:
            try:
                payload = json.loads(''.join(self.buffer))
                self.schemas.extend(payload.get('@graph', [payload]))
            except (ValueError, AttributeError) as error: self.schema_errors.append(str(error))
            self.jsonld = False; self.buffer = []
        if tag in ('script', 'style'): self.skip = max(0, self.skip - 1)


def pages():
    return sorted(p for p in ROOT.rglob('*.html') if not any(
        part in ('sections', '.git', '.dev-tools', 'tools', 'admin', 'backend') for part in p.relative_to(ROOT).parts))


def route(path):
    name = path.relative_to(ROOT).as_posix()
    if name == 'index.html': return '/'
    if name.endswith('/index.html'): return '/' + name[:-10]
    return '/' + name[:-5]


def inventory():
    parsed = {SITE + route(p): (p, Page(p.read_text(encoding='utf-8-sig'))) for p in pages()}
    inbound = {u: set() for u in parsed}
    for url, (_, page) in parsed.items():
        for link in page.links:
            target = urlsplit(urljoin(url, link))
            clean = target._replace(query='', fragment='').geturl()
            if clean in inbound and clean != url: inbound[clean].add(url)
    rows = []
    for url, (path, p) in parsed.items():
        types = [s.get('@type', '') for s in p.schemas]
        content = ' '.join(p.text)
        topic = p.headings['h1'][0] if p.headings['h1'] else p.title
        cluster = 'Species' if '/species/' in url else ('Applications' if '/applications/' in url else (
            'Cyanoflow' if '/cyanoflow' in url or 'microalgal' in path.stem and 'single' in path.stem else (
                'Algaephyte' if '/blog/' in url else 'Site')))
        rows.append({'url': url, 'file': path.relative_to(ROOT).as_posix(), 'current_title': p.title,
            'recommended_title': p.title, 'current_description': p.description, 'recommended_description': p.description,
            'h1': p.headings['h1'], 'h2': p.headings['h2'], 'intent': 'Informational' if cluster != 'Site' else 'Navigational / educational',
            'primary_topic': topic, 'secondary_topics': p.headings['h2'], 'journey_stage': 'Learn / evaluate research concepts',
            'cluster': cluster, 'content_words': len(content.split()),
            'content_quality': 'Editorial review required; word count is not a quality score',
            'internal_links_in': sorted(inbound[url]),
            'internal_links_out': sorted(set(urljoin(url, x) for x in p.links if urlsplit(urljoin(url, x)).netloc == 'orrbiologicals.com')),
            'external_sources': sorted(set(x for x in p.links if x.startswith('http') and urlsplit(x).netloc != 'orrbiologicals.com')),
            'canonical': p.canonical, 'schema_types': types, 'schema_errors': p.schema_errors,
            'images': p.images, 'image_quality': 'Illustrations vs measurements must be labeled; no pixel review implied',
            'image_alt_quality': {'missing': sum('alt' not in x for x in p.images), 'empty': sum(x.get('alt') == '' for x in p.images)},
            'indexability': 'noindex' if 'noindex' in p.robots else 'indexable',
            'importance': 'High' if path.name == 'index.html' or path.stem == 'cyanoflow' else 'Supporting',
            'action': 'NOINDEX' if 'noindex' in p.robots else ('IMPROVE' if '/blog/' in url else 'KEEP'),
            'h1_count': len(p.headings['h1']), 'duplicate_ids': [k for k, v in Counter(p.ids).items() if v > 1],
            'meta': p.meta})
    return rows


def http_check(url):
    start = time.perf_counter()
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'OrrBiologicals-SEO-Audit/1.0 (read-only website QA)'})
        with urllib.request.urlopen(req, timeout=20) as response:
            body = response.read()
            text = body.decode('utf-8', errors='replace')
            p = Page(text) if 'html' in response.headers.get('Content-Type', '') else None
            return {'url': url, 'final_url': response.url, 'status': response.status,
                'elapsed_ms': round((time.perf_counter() - start) * 1000), 'bytes': len(body),
                'headers': {k: v for k, v in response.headers.items() if k.lower() in (
                    'content-type', 'cache-control', 'content-encoding', 'x-robots-tag', 'server', 'last-modified')},
                'title': p.title if p else '', 'description': p.description if p else '',
                'canonical': p.canonical if p else '', 'robots': p.robots if p else '',
                'h1': p.headings['h1'] if p else [], 'h2': p.headings['h2'] if p else [],
                'links': p.links if p else [], 'images': p.images if p else [],
                'schema_types': [s.get('@type') for s in p.schemas] if p else [],
                'schema_errors': p.schema_errors if p else [], 'html_words': len(' '.join(p.text).split()) if p else 0}
    except urllib.error.HTTPError as error:
        return {'url': url, 'final_url': error.url, 'status': error.code}
    except (OSError, ValueError) as error:
        return {'url': url, 'status': None, 'error': str(error)}


def save_rows(out, rows):
    out.mkdir(parents=True, exist_ok=True)
    (out / 'pages.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
    with (out / 'pages.csv').open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0])); writer.writeheader()
        for row in rows:
            writer.writerow({k: json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else v for k, v in row.items()})


def main():
    args = argparse.ArgumentParser()
    args.add_argument('--out', default='docs/seo/current'); args.add_argument('--live', action='store_true')
    config = args.parse_args(); out = ROOT / config.out
    rows = inventory(); save_rows(out, rows)
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    sitemap = [n.text for n in ET.parse(ROOT / 'sitemap.xml').findall('.//s:loc', ns)]
    summary = {'pages': len(rows), 'indexable': sum(x['indexability'] == 'indexable' for x in rows),
        'sitemap_urls': len(sitemap), 'noindex_in_sitemap': [x['url'] for x in rows if x['url'] in sitemap and x['indexability'] == 'noindex'],
        'missing_from_sitemap': [x['url'] for x in rows if x['indexability'] == 'indexable' and x['url'] not in sitemap],
        'missing_descriptions': [x['url'] for x in rows if x['indexability'] == 'indexable' and not x['current_description']],
        'orphans_in_html': [x['url'] for x in rows if x['indexability'] == 'indexable' and not x['internal_links_in']],
        'duplicate_titles': [k for k, v in Counter(x['current_title'] for x in rows if x['indexability'] == 'indexable').items() if v > 1]}
    if config.live:
        urls = set(sitemap + [x['url'] for x in rows])
        urls.update(SITE + path for path in ('/robots.txt', '/sitemap.xml', '/seo-audit-nonexistent-20261004',
            '/pavlova-lutheri', '/control-loop-architecture', '/faq', '/index.html', '/blog/index.html', '/cyanoflow.html',
            '/cyanoflow/', '/blog/spirulina-is-a-cyanobacterium/', '/?utm_source=seo-audit'))
        urls.update(('http://orrbiologicals.com/', 'https://www.orrbiologicals.com/'))
        # Only public HTML routes: never probe secrets or submit forms.
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            live = list(pool.map(http_check, sorted(urls)))
        (out / 'live.json').write_text(json.dumps(live, ensure_ascii=False, indent=2), encoding='utf-8')
        summary['live_status_counts'] = dict(Counter(str(x['status']) for x in live))
    (out / 'summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__': main()

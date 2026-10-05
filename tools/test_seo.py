"""Full public-site SEO regression checks: stdlib only."""
import hashlib
import json
import re
import subprocess
import sys
import unittest
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent / 'site'))
from seo_audit import ROOT, SITE, Page, inventory, pages, route, SITEMAP_EXCLUDED


class Resources(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.refs = []; self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('img', 'script') and a.get('src'): self.refs.append(a['src'])
        if tag == 'link' and a.get('rel') in ('stylesheet', 'icon', 'apple-touch-icon') and a.get('href'):
            self.refs.append(a['href'])


class SEOTests(unittest.TestCase):
    def test_indexable_metadata_and_uniqueness(self):
        rows = [r for r in inventory() if r['indexability'] == 'indexable']
        for key in ('current_title', 'current_description', 'canonical', 'h1'):
            values = [json.dumps(r[key]) for r in rows]
            self.assertEqual(len(values), len(set(values)), key)
        for r in rows:
            with self.subTest(page=r['file']):
                self.assertTrue(r['current_title']); self.assertTrue(r['current_description'])
                self.assertEqual(r['h1_count'], 1); self.assertEqual(r['canonical'], r['url'])
                self.assertFalse(r['schema_errors']); self.assertFalse(r['duplicate_ids'])
                for key in ('twitter:title', 'twitter:description', 'twitter:image', 'og:title', 'og:description', 'og:url'):
                    self.assertTrue(r['meta'].get(key), key)
                self.assertEqual(r['meta']['og:url'], r['url'])
                self.assertTrue(r['internal_links_in'], 'orphan in source HTML')

    def test_sitemap_matches_canonical_indexable_pages(self):
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        xml = ET.parse(ROOT / 'sitemap.xml')
        urls = [n.text for n in xml.findall('.//s:loc', ns)]
        expected = [r['url'] for r in inventory() if r['indexability'] == 'indexable' and urlsplit(r['url']).path not in SITEMAP_EXCLUDED]
        self.assertCountEqual(urls, expected); self.assertEqual(len(urls), len(set(urls)))
        self.assertNotIn(SITE + '/game/', urls)
        for path in SITEMAP_EXCLUDED: self.assertNotIn(SITE + path, urls)
        for n in xml.findall('.//s:lastmod', ns):
            self.assertRegex(n.text, r'^\d{4}-\d{2}-\d{2}$')
        self.assertIn('Sitemap: ' + SITE + '/sitemap.xml', (ROOT / 'robots.txt').read_text())

    def test_all_source_links_and_assets(self):
        parsed = {p: Page(p.read_text(encoding='utf-8-sig')) for p in pages()}
        for path, page in parsed.items():
            text = path.read_text(encoding='utf-8-sig')
            for ref in page.links + Resources(text).refs:
                with self.subTest(page=route(path), ref=ref):
                    url = urlsplit(urljoin(SITE + route(path), ref))
                    if url.scheme not in ('http', 'https') or url.netloc != 'orrbiologicals.com': continue
                    target = ROOT / url.path.lstrip('/')
                    if target.is_dir(): target /= 'index.html'
                    elif not target.exists(): target = target.with_suffix('.html')
                    self.assertTrue(target.is_file(), 'missing local target')
                    if url.fragment and target.suffix == '.html':
                        other = parsed.get(target) or Page(target.read_text(encoding='utf-8-sig'))
                        self.assertIn(url.fragment, other.ids)
            for image in page.images:
                self.assertIn('alt', image)
                if image.get('src') and 'noindex' not in page.robots:
                    self.assertTrue(image.get('width')); self.assertTrue(image.get('height'))

    def test_scientific_status_and_article_dates(self):
        for name in ('index.html', 'cyanoflow.html'):
            p = Page((ROOT / name).read_text(encoding='utf-8'))
            self.assertNotIn('Product', [x.get('@type') for x in p.schemas])
            for node in p.schemas: self.assertNotIn('offers', node)
        for path in (ROOT / 'blog').glob('*.html'):
            if path.stem == 'index': continue
            text = path.read_text(encoding='utf-8'); page = Page(text)
            self.assertTrue(page.headings['h2']); self.assertIn('href="/research/"', text)
            self.assertIn('href="/glossary', text)
            self.assertNotIn('Reserve a reactor', text)
            published = page.meta.get('article:published_time')
            self.assertTrue(published); self.assertIn('datetime="' + published + '"', text)
            for node in page.schemas:
                if node.get('@type') in ('Article', 'BlogPosting'):
                    self.assertEqual(node['datePublished'], published)
                    self.assertEqual(node['dateModified'], page.meta['article:modified_time'])
            self.assertIn('BreadcrumbList', [x.get('@type') for x in page.schemas])

    def test_classification_and_static_directories(self):
        kb = json.loads((ROOT / 'blog/data/kb.json').read_text(encoding='utf-8'))
        al = {x['slug'] for x in kb['algaephyte']}
        self.assertTrue({'control-loop-architecture', 'digital-twin-droop-steele-model', 'six-culture-signals-main-senses'} <= al)
        text = (ROOT / 'blog/index.html').read_text(encoding='utf-8')
        for article in kb['algaephyte'] + kb['cyanoflow']:
            self.assertIn('href="' + article['url'] + '"', text)
        self.assertNotIn('fetch("/blog/data/kb.json")', text)
        self.assertNotIn('Journal figure', text)
        cyano = (ROOT / 'cyanoflow.html').read_text(encoding='utf-8')
        for article in kb['cyanoflow']: self.assertIn('href="' + article['url'] + '"', cyano)

    def test_build_is_deterministic_and_does_not_replace_home(self):
        files = [ROOT / x for x in ('index.html', 'blog/index.html', 'cyanoflow.html', 'blog/data/kb.json', 'sitemap.xml')]
        digest = lambda: [hashlib.sha256(p.read_bytes()).hexdigest() for p in files]
        before = digest()
        subprocess.run([sys.executable, str(ROOT / 'tools/site/build_seo.py')], check=True, capture_output=True)
        self.assertEqual(before, digest())

    def test_modular_home_sources_and_build_entrypoints(self):
        from build_home import render
        self.assertEqual((ROOT / 'index.html').read_text(encoding='utf-8'), render())
        self.assertIn('algae biotechnology', Page(render()).headings['h1'][0].lower())
        for name in ('build.ps1', 'rebuild.ps1'):
            text = (ROOT / name).read_text(encoding='utf-8-sig')
            self.assertNotIn('SliceLines', text)
            self.assertNotIn('cssMarkers', text)
        self.assertIn('build_seo.py', (ROOT / 'rebuild.ps1').read_text())

    def test_pillars_and_species_are_connected(self):
        for slug in ('algae-biotechnology', 'microalgae-cultivation', 'photobioreactors', 'algaephyte'):
            text = (ROOT / slug / 'index.html').read_text(encoding='utf-8')
            page = Page(text)
            self.assertGreater(len(page.headings['h2']), 5)
            self.assertGreater(len(' '.join(page.text).split()), 400)
            self.assertIn('href="/research/"', text)
        for path in (ROOT / 'applications/species').glob('*.html'):
            text = path.read_text(encoding='utf-8')
            for link in ('/microalgae-cultivation/', '/photobioreactors/', '/algaephyte/', '/cyanoflow'):
                self.assertIn('href="' + link + '"', text)
        blog = (ROOT / 'blog/index.html').read_text(encoding='utf-8')
        self.assertLess(blog.index('id="picks"'), blog.index('id="kb"'))
        for public in ('/blog/', '/applications/', '/cyanoflow', '/assets/', '/blog/data/'):
            self.assertNotIn('Disallow: ' + public, (ROOT / 'robots.txt').read_text())

    def test_header_navigation_is_consistent(self):
        expected = ('/#inside', '/applications/', '/algaephyte/', '/cyanoflow', '/blog/', '/game/', '/#deploy')
        for path in pages():
            text = path.read_text(encoding='utf-8-sig')
            m = re.search(r'<header class="nav"[^>]*>[\s\S]*?</header>', text)
            if not m: continue
            header = m.group(0)
            with self.subTest(page=route(path)):
                for href in expected:
                    self.assertIn('href="' + href + '"', header)
                self.assertNotIn('/#products', header)
                self.assertNotIn('Pilot access', header)
                self.assertIn('>Contact</a>', header)
        home = (ROOT / 'index.html').read_text(encoding='utf-8')
        for href in ('/blog/', '/game/', '/algaephyte/', '/cyanoflow'):
            self.assertIn('href="' + href + '"', home)

    def test_prose_links_are_not_underlined(self):
        css = (ROOT / 'css/extras.css').read_text(encoding='utf-8')
        m = re.search(r'\.prose a\{[^}]*\}', css)
        self.assertTrue(m, '.prose a rule missing')
        self.assertNotIn('text-decoration', m.group(0))

    def test_google_font_ranges_are_valid(self):
        for path in pages():
            text = path.read_text(encoding='utf-8-sig')
            self.assertNotIn('Source+Serif+4:opsz,wght@8..60,0..560', text, str(path))

    def test_redirect_rule_invariants(self):
        text = (ROOT / '.htaccess').read_text(encoding='utf-8-sig')
        self.assertIn('^/pavlova-lutheri', text)
        control = [line for line in text.splitlines() if line.startswith('Redirect') and '/control-loop-architecture' in line]
        self.assertEqual(len(control), 1); self.assertIn('/blog/control-loop-architecture', control[0])
        self.assertNotIn('Redirect 301 /research', text)
        self.assertLess(text.index('index(?:\\.html)?'), text.index('# --- clean URLs:'))
        self.assertIn('RewriteRule ^(?:sections|tools|docs)', text)
        # The /docs convenience redirect must be exact-match: a prefix
        # `Redirect 301 /docs` (mod_alias) runs before the per-directory F
        # rule and would 301 every /docs/* artifact to the homepage instead
        # of letting the F rule block it with 403.
        docs_lines = [line for line in text.splitlines() if line.startswith('Redirect') and '/docs' in line]
        self.assertEqual(len(docs_lines), 1)
        self.assertEqual(docs_lines[0].strip(), 'RedirectMatch 301 ^/docs/?$ /#journal')


if __name__ == '__main__': unittest.main()

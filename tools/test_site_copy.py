"""Static regression checks for concept-stage website copy.

Run from the website repository: python -m unittest discover -s tools -p 'test_*.py'
"""
import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids = []
        self.links = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if attrs.get(key):
                self.links.append(attrs[key])


class SiteCopyTests(unittest.TestCase):
    def test_home_origin_and_status(self):
        text = (ROOT / 'index.html').read_text(encoding='utf-8')
        self.assertIn('shocked by how hard it was to access algae biotechnology', text)
        self.assertIn('college coursework and microbiology', text)
        self.assertIn('not available for purchase or deployment', text)
        self.assertNotRegex(text, r'AP-0[1-7]|PreOrder|orrSubscribeForm|orrSuccess')

    def test_home_metadata_is_valid_and_not_an_offer(self):
        text = (ROOT / 'index.html').read_text(encoding='utf-8')
        payload = re.search(r'<script type="application/ld\+json">(.*?)</script>', text, re.S)
        data = json.loads(payload.group(1))
        self.assertEqual(data['@graph'][-1]['@type'], 'CreativeWork')
        self.assertNotIn('offers', data['@graph'][-1])

    def test_assets_and_local_anchors(self):
        for name in ('index.html', 'cyanoflow.html', 'applications/index.html', 'blog/index.html', 'disclaimer.html'):
            with self.subTest(page=name):
                page = Page((ROOT / name).read_text(encoding='utf-8'))
                self.assertEqual(len(page.ids), len(set(page.ids)))
                for link in page.links:
                    parsed = urlsplit(link)
                    if parsed.scheme or parsed.netloc:
                        continue
                    if not parsed.path:
                        if parsed.fragment:
                            self.assertIn(parsed.fragment, page.ids)
                        continue
                    target = ROOT / parsed.path.lstrip('/') if parsed.path.startswith('/') else (ROOT / name).parent / parsed.path
                    self.assertTrue(target.exists() or target.with_suffix('.html').exists(), str(target))

    def test_images_and_simulations_are_retained(self):
        text = (ROOT / 'index.html').read_text(encoding='utf-8')
        for value in ('assets/images/hero.jpg', 'assets/images/microscopy/bench-photo.jpg', 'assets/images/instrument-photo.jpg', 'id="cultureSim"', 'id="simControls"', 'id="dVol"'):
            self.assertIn(value, text)
        self.assertIn('id="chipSim"', (ROOT / 'cyanoflow.html').read_text(encoding='utf-8'))

    def test_blog_pipeline_and_data_contract(self):
        workflow = (ROOT / '.github/workflows/focus-of-the-day.yml').read_text(encoding='utf-8')
        self.assertIn('secrets.GROQ_API_KEY', workflow)
        self.assertIn('pick_articles.py --date "$TODAY"', workflow)
        index = json.loads((ROOT / 'blog/data/picks/index.json').read_text(encoding='utf-8'))
        self.assertTrue(index['days'])
        self.assertEqual(len(index['days'][0]['picks']), 4)
        for pick in index['days'][0]['picks']:
            self.assertTrue(pick['url'].startswith('https://'))
            self.assertGreaterEqual(len(pick['article']), 200)

    def test_no_fictional_history_in_dynamic_copy(self):
        text = (ROOT / 'js/site.js').read_text(encoding='utf-8')
        self.assertNotRegex(text, r'AP-0[1-7]|02:14|01:51|we measured|our own columns')
        self.assertIn('Planned', text)
        self.assertIn('No finished reactor or deployment', text)

    def test_shared_article_disclosure(self):
        script = (ROOT / 'js/navigation.js').read_text(encoding='utf-8')
        self.assertIn('Project status:', script)
        self.assertIn('research concepts in development', script)


if __name__ == '__main__':
    unittest.main()

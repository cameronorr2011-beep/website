import re
import sys
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools/site'))
from design_system import apply
from seo_audit import pages

class DesignSystemTests(unittest.TestCase):
    def test_shared_shell_is_static_and_idempotent(self):
        header=(ROOT/'sections/header.html').read_text(encoding='utf-8').strip()
        for path in pages():
            with self.subTest(page=str(path.relative_to(ROOT))):
                text=path.read_text(encoding='utf-8')
                self.assertIn(header,text)
                self.assertEqual(text.count('id="nav"'),1)
                self.assertEqual(text.count('id="mobileMenu"'),1)
                self.assertEqual(text.count('<footer'),1)
                self.assertEqual(text,apply(text))
                for css in ('global','header','orr-home','animations'):
                    self.assertEqual(len(re.findall(r'href="/css/'+css+r'\.css',text)),1)
                self.assertNotIn('fonts.googleapis.com/css',text)

    def test_motion_has_no_scientific_countup_or_decorative_loop(self):
        js=(ROOT/'js/animations.js').read_text(encoding='utf-8')
        self.assertNotIn('Math.random',js)
        self.assertNotIn('target*eased',js)
        self.assertIn('prefers-reduced-motion',js)
        dashboard=(ROOT/'js/main-dashboard.js').read_text(encoding='utf-8')
        self.assertIn('animateUntil',dashboard)
        self.assertIn('visibilitychange',dashboard)
        self.assertIn('IntersectionObserver',dashboard)

    def test_deep_links_and_scientific_qualifications_remain(self):
        text=(ROOT/'index.html').read_text(encoding='utf-8')
        for anchor in ('inside','system','stack','signals','twin','safety','mesh','journal','faults','faq','deploy','simulation','dVol','cultureSim'):
            self.assertIn('id="'+anchor+'"',text)
        for qualification in ('not measured laboratory data','Model assumptions','not a calibrated time-series prediction','not available for purchase or deployment','not tested','not a report from deployed instruments'):
            if qualification=='not tested':
                self.assertIn('Until tested',text)
            else:self.assertIn(qualification,text)
        self.assertIn('id="technical-notes"',text)
        self.assertIn('role="status" aria-live="polite"',text)

if __name__=='__main__':unittest.main()

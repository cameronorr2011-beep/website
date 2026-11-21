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
            text=path.read_text(encoding='utf-8')
            relative = path.relative_to(ROOT).as_posix()
            if relative.startswith(('algae-growth/', 'game/')) or relative in ('hatcheries.html', 'kits.html'):
                # Immersive game surfaces and minimal redirect stubs own their shell.
                continue
            with self.subTest(page=str(path.relative_to(ROOT))):
                if 'class="site-head"' in text:
                    # Commerce pages use the redesigned static header/footer.
                    self.assertIn('<header class="site-head">', text)
                    self.assertIn('class="site-foot"', text)
                    self.assertEqual(text.count('id="main"'), 1)
                    self.assertIn('href="/styles.css', text)
                    self.assertNotIn('id="mobileMenu"', text)
                    self.assertNotIn('id="nav"', text)
                    self.assertEqual(text, apply(text))
                    continue
                # Legacy scientific pages keep the shared editorial shell.
                self.assertIn(header,text)
                self.assertEqual(text.count('id="nav"'),1)
                self.assertEqual(text.count('id="mobileMenu"'),1)
                self.assertEqual(text.count('<footer'),1)
                self.assertEqual(text,apply(text))
                for css in ('global','header','orr-home','animations','site-redesign'):
                    self.assertEqual(len(re.findall(r'href="/css/'+css+r'\.css',text)),1)
                self.assertNotIn('fonts.googleapis.com/css',text)

    def test_deployment_modules_and_brief_images(self):
        apache=(ROOT/'.htaccess').read_text(encoding='utf-8-sig')
        self.assertIn('AddType application/javascript .mjs',apache)
        blog=(ROOT/'articles/index.html').read_text(encoding='utf-8')
        self.assertNotIn('src=""',blog)
        self.assertRegex(blog,r'<img[^>]+width="\d+"[^>]+height="\d+"')

    def test_motion_has_no_scientific_countup_or_decorative_loop(self):
        js=(ROOT/'js/animations.js').read_text(encoding='utf-8')
        self.assertNotIn('Math.random',js)
        self.assertNotRegex(js, r'\b(?:target|eased)\s*\*\s*(?:target|eased)\b')
        self.assertIn('prefers-reduced-motion',js)
        dashboard=(ROOT/'js/main-dashboard.js').read_text(encoding='utf-8')
        self.assertIn('animateUntil',dashboard)
        self.assertIn('visibilitychange',dashboard)
        self.assertIn('IntersectionObserver',dashboard)

    def test_deep_links_and_scientific_qualifications_remain(self):
        text=(ROOT/'index.html').read_text(encoding='utf-8')
        for anchor in ('main','top','about','systems','thesis','deploy','kit-teaser','faq-h'):
            self.assertIn('id="'+anchor+'"',text)
        for qualification in ('Generated image','illustrative','not a photograph'):
            self.assertIn(qualification,text)
        for asset in ('/styles.css','/assets/hero.css','/assets/hero.js','/site.js'):
            self.assertIn(asset,text)
        self.assertNotIn('/papertrail/',text)
        self.assertNotIn('/culturetrace/',text)
        self.assertNotIn('$59',text)

    def test_algaephyte_workflow_is_explicit(self):
        text=(ROOT/'algaephyte/index.html').read_text(encoding='utf-8')
        self.assertIn('SENSE <span>→</span> MODEL <span>→</span> CHECK <span>→</span> PROPOSE <span>→</span> VERIFY', text)
        self.assertIn('data-loop-step="verify"', text)
        for step in ('Sense', 'Model', 'Check', 'Propose', 'Verify'):
            self.assertIn('<h3>' + step + '</h3>', text)

if __name__=='__main__':unittest.main()

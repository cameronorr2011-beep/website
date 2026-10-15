"""Dependency-free static contract checks for the PaperTrail vertical slice."""

from html.parser import HTMLParser
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "papertrail" / "index.html"
APP = ROOT / "papertrail" / "js" / "app.js"
STORE = ROOT / "papertrail" / "js" / "store.js"
API = ROOT / "papertrail" / "js" / "api.js"
CSS = ROOT / "papertrail" / "css" / "papertrail.css"


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.description = ""
        self.canonical = ""
        self.h1 = []
        self.assets = []
        self._capture = None
        self._buffer = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "title":
            self._capture = "title"
            self._buffer = []
        if tag == "h1":
            self._capture = "h1"
            self._buffer = []
        if tag == "meta" and attributes.get("name") == "description":
            self.description = attributes.get("content", "")
        if tag == "link" and attributes.get("rel") == "canonical":
            self.canonical = attributes.get("href", "")
        if tag == "link" and attributes.get("rel") == "stylesheet":
            self.assets.append(attributes.get("href", ""))
        if tag == "script" and attributes.get("src"):
            self.assets.append(attributes["src"])

    def handle_data(self, data):
        if self._capture:
            self._buffer.append(data)

    def handle_endtag(self, tag):
        if self._capture == tag:
            value = re.sub(r"\s+", " ", "".join(self._buffer)).strip()
            if tag == "title":
                self.title = value
            elif tag == "h1":
                self.h1.append(value)
            self._capture = None
            self._buffer = []


def read(path):
    return path.read_text(encoding="utf-8")


class PaperTrailContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page_text = read(PAGE)
        cls.app_text = read(APP)
        cls.store_text = read(STORE)
        cls.api_text = read(API)
        cls.css_text = read(CSS)
        cls.parser = PageParser()
        cls.parser.feed(cls.page_text)
        cls.runtime_text = "\n".join((cls.app_text, cls.store_text, cls.api_text, cls.css_text))

    def test_metadata_one_h1_and_canonical(self):
        self.assertIn("PaperTrail", self.parser.title)
        self.assertTrue(self.parser.description)
        self.assertEqual(self.parser.canonical, "https://orrbiologicals.com/papertrail/")
        self.assertEqual(len(self.parser.h1), 1)

    def test_no_external_runtime_dependencies(self):
        self.assertNotIn("cdn.", self.runtime_text.lower())
        self.assertNotIn("fonts.googleapis.com", self.runtime_text)
        self.assertNotRegex(self.app_text, r'from\s+["\']three(?:/|["\'])')
        self.assertNotIn("fetch(", self.app_text)
        self.assertNotIn("fetch(", self.store_text)
        self.assertIn("fetch(", self.api_text)
        self.assertRegex(self.api_text, r"if \(!configured\)")
        self.assertTrue(self.parser.assets)
        for asset in self.parser.assets:
            self.assertTrue(asset.startswith("/"), asset)
        self.assertIn("/papertrail/css/papertrail.css", self.parser.assets)
        self.assertIn("/papertrail/js/app.js", self.parser.assets)
        self.assertRegex(self.app_text, r'import .* from "/papertrail/js/(?:api|store)\.js"')

    def test_application_markers_and_working_flow(self):
        for marker in (
            'class="papertrail-app"',
            'id="pt-start"',
            'id="pt-reset"',
            'id="pt-reset-dialog"',
            'id="pt-storage-card"',
            'id="pt-live-card"',
            'data-view="agents"',
            'data-view="evidence"',
            'data-view="claims"',
            'data-view="debate"',
            'data-view="graph"',
            'data-view="report"',
        ):
            self.assertIn(marker, self.page_text)
        self.assertIn("Export session JSON", self.app_text)
        for marker in (
            "createSession",
            "loadSession",
            "saveSession",
            "SOURCES",
            "RECORDS",
            "AGENT_ROLES",
            "AGENT_OUTPUTS",
            "DEBATE",
            "GRAPH",
            "REPORT",
            "advanceRun",
            "renderClaims",
            "exportJson",
        ):
            self.assertIn(marker, self.app_text)
        self.assertIn("schemaVersion", self.store_text)

    def test_synthetic_labeling_and_demo_link_boundary(self):
        self.assertIn('const DEMO_LABEL = "SYNTHETIC DEMONSTRATION DATA"', self.app_text)
        self.assertIn('class="pt-synthetic-label">SYNTHETIC DEMONSTRATION DATA</span>', self.page_text)
        self.assertIn("provenance: DEMO_LABEL", self.app_text)
        self.assertIn("label: DEMO_LABEL", self.app_text)
        for marker in (
            "SYNTHETIC DEMONSTRATION DATA",
            "NON-REAL DEMO LINK",
            "synthetic demo",
            "live mode is unavailable",
            "API UNAVAILABLE",
            "UNRESOLVED",
            "QUALIFIED INFERENCE",
        ):
            self.assertIn(marker.lower(), self.runtime_text.lower())
        self.assertRegex(self.app_text, r"https://example\.invalid/papertrail-demo/source-[1-4]")
        self.assertNotRegex(self.runtime_text, r"\b10\.\d{4,9}/")

    def test_no_secret_like_key_and_no_secret_transport(self):
        secret_patterns = (
            r"(?i)\bapi[_-]?key\b\s*[:=]",
            r"(?i)\bclient[_-]?secret\b\s*[:=]",
            r"(?i)\baccess[_-]?token\b\s*[:=]",
            r"(?i)\bpassword\b\s*[:=]",
            r"(?i)\bauthorization\b\s*[:=]",
        )
        for pattern in secret_patterns:
            self.assertNotRegex(self.runtime_text, pattern)
        self.assertNotIn("process.env", self.runtime_text)
        self.assertNotIn("document.cookie", self.runtime_text)

    def test_absolute_local_asset_paths_and_scoped_css(self):
        for asset in self.parser.assets:
            self.assertTrue(asset.startswith("/"), asset)
        for asset in self.parser.assets:
            if "papertrail/" in asset:
                self.assertTrue(asset.startswith("/papertrail/"), asset)
        self.assertNotRegex(self.css_text, r"(?m)^\s*(?:html|body|:root|button|a)\s*\{")
        for selector in re.findall(r"([^{}]+)\{", self.css_text):
            cleaned = selector.strip()
            if cleaned.startswith("@") or cleaned.endswith("::backdrop"):
                continue
            self.assertIn(".papertrail-app", cleaned, cleaned)

    def test_relevant_stable_source_evidence_claim_and_agent_ids(self):
        for identifier in (
            "PT-SRC-001",
            "PT-SRC-002",
            "PT-SRC-003",
            "PT-SRC-004",
            "PT-EVD-001",
            "PT-EVD-005",
            "PT-CLM-001",
            "PT-CLM-002",
            "PT-CLM-003",
            "PT-AGENT-CUR-001",
            "PT-AGENT-QUA-002",
            "PT-AGENT-SKE-003",
            "PT-AGENT-ADJ-004",
            "PT-RPT-001",
        ):
            self.assertIn(identifier, self.app_text)
        self.assertIn('evidence: {', self.store_text)
        self.assertIn('analysis: {', self.store_text)
        self.assertIn('agentOutputs: {}', self.store_text)


if __name__ == "__main__":
    unittest.main()

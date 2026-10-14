"""Static contract checks for the Orr Biologicals synthetic research lab."""

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ResearchLabContractTests(unittest.TestCase):
    def test_lab_entry_uses_the_biorealm_application_surface(self):
        text = (ROOT / "game/index.html").read_text(encoding="utf-8")
        for marker in (
            'id="biorealmApp"', 'id="gameNav"', 'id="gameView"',
            'id="creditsReadout"', 'id="incomeReadout"',
            'id="biomassReadout"', 'id="archiveReadout"',
            'data-view="expedition"', 'data-view="reactors"',
            'data-view="collection"', 'data-view="research"',
        ):
            self.assertIn(marker, text)
        self.assertTrue(any(marker in text for marker in (
            'SYNTHETIC DATA', 'SYNTHETIC MODE', 'SYNTHETIC + DEVICE OPT-IN',
        )))
        self.assertTrue('dist/lab-' in text or 'dist/bio-' in text)
        self.assertNotIn('Algae Living — Grow. Evolve. Survive.', text)
        self.assertNotIn('cdn.jsdelivr.net', text)

    def test_biorealm_has_the_complete_progression_surface(self):
        app = (ROOT / "game/js/biorealm-app.js").read_text(encoding="utf-8")
        engine = (ROOT / "game/js/biorealm-engine.js").read_text(encoding="utf-8")
        scene = (ROOT / "game/js/biorealm-scene.js").read_text(encoding="utf-8")
        audio = (ROOT / "game/js/biorealm-audio.js").read_text(encoding="utf-8")
        for marker in (
            'SAVE_KEY', 'createInitialState', 'applyOffline', 'collectExpedition',
            'startExpedition', 'harvestAll', 'assignSpecies', 'buyReactor',
            'buyUpgrade', 'renderScene', 'exportSave',
        ):
            self.assertIn(marker, app if marker in app else engine)
        for marker in ('BIOMES', 'SPECIES', 'DEVICES', 'REACTOR_TIERS', 'UPGRADES', 'EVENTS', 'serializeState', 'safeLoad'):
            self.assertIn(marker, engine)
        self.assertIn('createScene', scene)
        self.assertIn('speciesPortrait', scene)
        self.assertIn('createAmbientAudio', audio)

    def test_engine_is_deterministic_and_has_both_domains(self):
        text = (ROOT / "game/js/lab-engine.js").read_text(encoding="utf-8")
        for symbol in (
            "createLabState",
            "runCompleteWorkflow",
            "startCultivation",
            "setParameter",
            "serializeState",
            "parseState",
            "runSelfTest",
            "MODEL_ASSUMPTIONS",
        ):
            self.assertRegex(text, rf"\b{symbol}\b")
        self.assertNotIn("Math.random", text)
        self.assertIn('provenance: "synthetic simulation"', text)
        self.assertIn('not a validated biochemical measurement', text)

    def test_store_and_renderer_are_offline_capable(self):
        store = (ROOT / "game/js/lab-store.js").read_text(encoding="utf-8")
        renderer = (ROOT / "game/js/lab3d.js").read_text(encoding="utf-8")
        for symbol in ("loadState", "saveState", "downloadState", "parseState"):
            self.assertIn(symbol, store)
        self.assertIn("SoftwareLab3D", renderer)
        self.assertIn("setCamera", renderer)
        self.assertIn("pointermove", renderer)
        self.assertIn("pick(event)", renderer)

    def test_hardware_boundary_is_explicit_and_safe(self):
        providers = (ROOT / "game/js/lab-providers.js").read_text(encoding="utf-8")
        for symbol in ("createMockSensorProvider", "createRealDeviceProvider", "validateReading", "MCP3008", "contractVersion"):
            self.assertIn(symbol, providers)
        self.assertIn('status: "unavailable"', providers)
        self.assertNotIn("actuator", providers.lower())

    def test_selection_and_comparison_surfaces_are_present(self):
        app = (ROOT / "game/js/lab-app.js").read_text(encoding="utf-8")
        for marker in ("criteriaDefinitions", "setSelectionCriteria", "comparisonMarkup", "Capture synthetic calibration", "Final biomass by run"):
            self.assertIn(marker, app)

    def test_lab_controls_have_real_ranges(self):
        app = (ROOT / "game/js/lab-app.js").read_text(encoding="utf-8")
        self.assertGreaterEqual(len(re.findall(r"\[\"[a-zA-Z]+(?:Ppfd|Hours|atureC|Rate|Um|Mm)\"", app)), 4)
        for action in ("demo-run", "next-stage", "transfer", "record", "export-report"):
            self.assertIn(f'data-action="{action}"', app)


if __name__ == "__main__":
    unittest.main()

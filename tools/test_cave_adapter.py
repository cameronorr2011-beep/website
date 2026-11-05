"""Mocked tests for the MICrONS CAVE adapter scaffold.

Stdlib only; runs offline via tools/test_all.mjs discovery. Uses the
recorded-format fixture (explicitly NOT real CAVE data) to prove the
version-pinning, chunking, retry, and manifest logic.
"""

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "neuroml"))

from cave_adapter import (  # noqa: E402
    CaveAdapter,
    FixtureClient,
    LiveBlockedError,
    UnpinnedVersionError,
    check_live_egress,
    retry,
)

FIXTURE = os.path.join(os.path.dirname(__file__), "neuroml", "fixtures", "discovery_example.json")


def make_adapter():
    with open(FIXTURE) as fh:
        return CaveAdapter(FixtureClient(json.load(fh)))


class TestPinning(unittest.TestCase):
    def test_unpinned_query_refused(self):
        adapter = make_adapter()
        with self.assertRaises(UnpinnedVersionError):
            adapter.query_table_chunked("synapses_pni_2", max_rows=1)
        with self.assertRaises(UnpinnedVersionError):
            adapter.table_schema("synapses_pni_2")

    def test_pin_rejects_bad_versions(self):
        adapter = make_adapter()
        for bad in (0, -3, "1926", None):
            with self.assertRaises(Exception):
                adapter.pin_version(bad)

    def test_discover_then_pin_then_query(self):
        adapter = make_adapter()
        payload = adapter.discover()
        latest = max(payload["versions_available"])
        self.assertEqual(latest, 1926)
        adapter.pin_version(latest)
        rows = adapter.query_table_chunked("synapses_pni_2", chunk=1, max_rows=10)
        # Only rows at pinned version 1926 are returned (chunked 1+1, then stop).
        self.assertEqual(len(rows), 2)
        self.assertTrue(all(r["_v"] == 1926 for r in rows))

    def test_pagination_respects_max_rows(self):
        adapter = make_adapter()
        adapter.pin_version(1926)
        rows = adapter.query_table_chunked("synapses_pni_2", chunk=1, max_rows=1)
        self.assertEqual(len(rows), 1)


class TestManifest(unittest.TestCase):
    def test_manifest_records_versions_and_hashes(self):
        adapter = make_adapter()
        adapter.discover()
        adapter.pin_version(1926)
        adapter.query_table_chunked("synapses_pni_2", max_rows=2)
        manifest = adapter.manifest.to_dict()
        self.assertTrue(manifest["version_pinned"])
        self.assertEqual(manifest["materialization_version"], 1926)
        self.assertGreaterEqual(len(manifest["queries"]), 2)
        for entry in manifest["queries"]:
            self.assertRegex(entry["payload_sha256"], r"^[0-9a-f]{64}$")

    def test_retry_succeeds_after_transient_failure(self):
        calls = []

        def flaky():
            calls.append(1)
            if len(calls) < 3:
                raise ConnectionError("transient")
            return "ok"

        self.assertEqual(retry(flaky, base_delay=0), "ok")
        self.assertEqual(len(calls), 3)

    def test_retry_does_not_mask_adapter_errors(self):
        with self.assertRaises(UnpinnedVersionError):
            retry(lambda: (_ for _ in ()).throw(UnpinnedVersionError("x")))


class TestLiveGuard(unittest.TestCase):
    def test_egress_probe_fails_closed_in_sandbox(self):
        # Localhost closed port fails fast and deterministically; proves the
        # guard raises LiveBlockedError instead of hanging or pretending.
        import cave_adapter as mod

        original = mod.EGRESS_PROBE_URL
        mod.EGRESS_PROBE_URL = "https://127.0.0.1:9/probe"
        try:
            with self.assertRaises(LiveBlockedError):
                check_live_egress(timeout=2.0)
        finally:
            mod.EGRESS_PROBE_URL = original


if __name__ == "__main__":
    unittest.main()

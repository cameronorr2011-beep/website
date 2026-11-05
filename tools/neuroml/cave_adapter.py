#!/usr/bin/env python3
"""MICrONS CAVE data adapter (scaffold, Sprint 0/1).

Real ingestion path with mandatory version pinning and manifests. Live CAVE
calls require open egress (unavailable in the Arena sandbox, see
orr-project/BLOCKERS.md B-001); without --live the adapter runs against a
recorded --fixture file so the manifest pipeline is genuinely testable.

Never hardcoded as truth: datastack metadata, materialization versions, table
schemas. Defaults below are starting hints only and are overwritten by
discovery output.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone


HINT_DATASTACK = "minnie65_public"
CODE_VERSION = "cave_adapter v0.1 (Sprint 0 scaffold)"
EGRESS_PROBE_URL = "https://global.daf-apis.com/info/api/v2/datastack/minnie65_public"


class AdapterError(Exception):
    pass


class UnpinnedVersionError(AdapterError):
    pass


class LiveBlockedError(AdapterError):
    pass


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def sha256_of(obj) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True, default=str).encode()).hexdigest()


def check_live_egress(timeout: float = 8.0) -> None:
    """Probe the CAVE global API. Raises LiveBlockedError when unreachable."""
    req = urllib.request.Request(EGRESS_PROBE_URL, headers={"User-Agent": "orr-biologicals-cave-adapter/0.1"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status != 200:
                raise LiveBlockedError(f"CAVE probe returned HTTP {resp.status}")
    except LiveBlockedError:
        raise
    except Exception as exc:  # sandbox egress block lands here
        raise LiveBlockedError(
            "Live CAVE access unreachable from this environment "
            f"({exc}). See orr-project/BLOCKERS.md B-001: run with --live on an "
            "open-network machine, or use --fixture to validate the pipeline."
        ) from exc


def retry(call, *, attempts: int = 4, base_delay: float = 1.0):
    """Source-specific retry with exponential backoff (no retry on AdapterError)."""
    last = None
    for i in range(attempts):
        try:
            return call()
        except AdapterError:
            raise
        except Exception as exc:
            last = exc
            time.sleep(base_delay * (2 ** i))
    raise AdapterError(f"exhausted {attempts} attempts: {last}")


@dataclass
class IngestionManifest:
    datastack: str
    materialization_version: int | None
    queries: list = field(default_factory=list)
    code_version: str = CODE_VERSION
    started_utc: str = field(default_factory=utcnow)

    def record(self, name: str, payload: dict, row_count: int | None = None) -> dict:
        entry = {
            "name": name,
            "at_utc": utcnow(),
            "materialization_version": self.materialization_version,
            "row_count": row_count,
            "payload_sha256": sha256_of(payload),
        }
        self.queries.append(entry)
        return entry

    def to_dict(self) -> dict:
        return {
            "code_version": self.code_version,
            "datastack": self.datastack,
            "materialization_version": self.materialization_version,
            "version_pinned": self.materialization_version is not None,
            "started_utc": self.started_utc,
            "finished_utc": utcnow(),
            "queries": self.queries,
        }


class CaveAdapter:
    """Duck-typed over a CAVE client (real CAVEclient or fixture-backed fake).

    The client must expose: get_datastack_info() -> dict with 'synapse_table';
    get_versions() -> list of version dicts/ints; table_schema(table) -> dict;
    query_table(table, *, limit, offset, materialization_version) -> list[dict].
    """

    def __init__(self, client, datastack: str = HINT_DATASTACK):
        self.client = client
        self.datastack = datastack
        self.version: int | None = None
        self.manifest = IngestionManifest(datastack=datastack, materialization_version=None)

    def discover(self) -> dict:
        info = retry(self.client.get_datastack_info)
        versions = retry(self.client.get_versions)
        payload = {"datastack_info": info, "versions_available": versions}
        self.manifest.record("discover", payload)
        return payload

    def pin_version(self, version: int) -> int:
        if not isinstance(version, int) or version <= 0:
            raise AdapterError(f"invalid materialization version: {version!r}")
        self.version = version
        self.manifest.materialization_version = version
        return version

    def _require_pin(self) -> int:
        if self.version is None:
            raise UnpinnedVersionError(
                "refusing unpinned query: call pin_version() with a discovered "
                "materialization version first (reproducibility rule)."
            )
        return self.version

    def table_schema(self, table: str) -> dict:
        version = self._require_pin()
        schema = retry(lambda: self.client.table_schema(table))
        self.manifest.record(f"schema:{table}", {"schema": schema, "version": version})
        return schema

    def query_table_chunked(self, table: str, *, chunk: int = 1000, max_rows: int | None = None) -> list:
        """Bounded, paginated retrieval. Never 'download everything'."""
        version = self._require_pin()
        rows: list = []
        offset = 0
        while True:
            want = chunk if max_rows is None else min(chunk, max_rows - len(rows))
            if want <= 0:
                break
            batch = retry(
                lambda w=want, o=offset: self.client.query_table(
                    table, limit=w, offset=o, materialization_version=version
                )
            )
            if not batch:
                break
            rows.extend(batch)
            offset += len(batch)
            if len(batch) < want or (max_rows is not None and len(rows) >= max_rows):
                break
        self.manifest.record(f"query:{table}", {"table": table, "version": version}, row_count=len(rows))
        return rows


class FixtureClient:
    """Offline stand-in replaying recorded discovery/query responses."""

    def __init__(self, fixture: dict):
        self.f = fixture

    def get_datastack_info(self):
        return self.f["datastack_info"]

    def get_versions(self):
        return self.f["versions_available"]

    def table_schema(self, table):
        return self.f["schemas"][table]

    def query_table(self, table, *, limit, offset, materialization_version):
        rows = [r for r in self.f["rows"].get(table, []) if r.get("_v", materialization_version) == materialization_version]
        return rows[offset:offset + limit]


def cmd_discover(args) -> int:
    if args.live:
        check_live_egress()
        print("live CAVE client wiring is not implemented yet (T-010); discovery scaffold only.")
        return 3
    fixture = json.load(open(args.fixture))
    adapter = CaveAdapter(FixtureClient(fixture), datastack=fixture.get("datastack", HINT_DATASTACK))
    payload = adapter.discover()
    versions = payload["versions_available"]
    latest = max(v if isinstance(v, int) else v["version"] for v in versions)
    adapter.pin_version(latest)
    info = payload["datastack_info"]
    print(f"datastack={adapter.datastack} pinned_version={latest} synapse_table={info.get('synapse_table')}")
    if args.out:
        json.dump(adapter.manifest.to_dict(), open(args.out, "w"), indent=2)
        print(f"manifest={args.out}")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="MICrONS CAVE adapter (scaffold)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("discover", help="discover datastack + pin latest version")
    d.add_argument("--fixture", default="tools/neuroml/fixtures/discovery_example.json")
    d.add_argument("--live", action="store_true", help="attempt live CAVE egress (open network only)")
    d.add_argument("--out", default="")
    d.set_defaults(func=cmd_discover)
    args = ap.parse_args(argv)
    try:
        return args.func(args)
    except AdapterError as exc:
        print(f"adapter error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

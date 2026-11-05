# DECISION_LOG.md

## D-001 — Single-agent staffing, recorded honestly (2026-11-04)

Twelve-role structure (§2.4) collapses to one Director agent: no sub-agent
tool exists in this session and prior `arena/*` branches are completed past
sessions, not live collaborators. No fictitious delegation. Revisit if the
environment gains parallel agents.

## D-002 — First API ships as static JSON under `/api/v1/*.json` (2026-11-04)

Rationale: production hosting is static; a "REST API" that 404s is worse than
real versioned JSON files served with `application/json`. Only real,
verifiable content is published (dataset registry entries with checksums).
Extensionless routes (`/api/v1/datasets`) deferred to T-040; `/developers/`
keeps its "planned, not live" status until routing is verified end-to-end.

## D-003 — `orr-project/` is internal tooling, blocked from HTTP (2026-11-04)

Added to the existing `.htaccess` blocked-prefix rule alongside
`sections|tools|docs`. Contains no secrets, but project management is not
public content. Additive rule; no existing route affected.

## D-004 — CAVE adapter: mocked tests in sandbox, live runs on open network (2026-11-04)

Adapter code + version-pinning + manifest logic are implemented and unit-tested
here with a fake client. Live CAVE calls are never attempted from the sandbox
(B-001); the adapter refuses to run live without open egress and records the
environment in every manifest. No "pretend retrieval."

## D-005 — FlyWire license treated as CC BY-NC 4.0 pending clarification (2026-11-04)

Adopted from prior Arena session's finding (`docs/connectome.md` on
`arena/e676bd12-game-website`): Zenodo record says CC BY 4.0, flywire.ai
guidelines say CC BY-NC 4.0. Conservative treatment until rights-holder
clarity. No commercial-use claims; attribution preserved.

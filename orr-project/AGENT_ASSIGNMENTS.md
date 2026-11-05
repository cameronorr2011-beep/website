# AGENT_ASSIGNMENTS.md — Honest staffing record

## Available agents (verified, not assumed)

This session provides **exactly one agent**: the Arena session agent acting as
`Orr Biologicals Research and Engineering Director`. There is:

- No live sub-agent / multi-agent tool in this environment.
- No background-agent fleet; `start_process` runs OS processes, not agents.
- No channel to other Arena sessions. Prior `arena/*` branches on
  `game-website` (`aa31f806`, `e676bd12`, Nov 3–4) are **completed past
  sessions**, not live collaborators. Their merged/closed work is audited via
  git history (see `docs/INITIAL_SYSTEM_AUDIT.md`), which is the only form of
  "communication" available — through committed artifacts, not dialogue.

Per directive §2.4: roles below are combined into the single Director. Nothing
is delegated to fictitious agents. When the environment genuinely supports
parallel agents, assignments will be recorded here with session/branch proof.

## Role coverage (all by Director unless noted)

| Role | Coverage | Notes |
|---|---|---|
| A Principal Architect | Director | Audit + registry + API contract this session |
| B Mouse Connectomics | Director | CAVE adapter scaffold; live run blocked (B-001) |
| C Neuroscience ML | deferred | Needs functional data (Sprint 3+) |
| D Graph ML | deferred | Fly graph available; starts Sprint 4 |
| E Literature | Director (partial) | `/literature/` verified working; server adapters later |
| F Fly Engineer | Director (partial) | Audit + hash verification done; no changes to fly app |
| G Visualization | deferred | After first data (Sprint 2) |
| H API/Developer | Director | Static `api/v1/*.json` this session |
| I Website Creative | deferred | Sprint 8; audit notes only |
| J Algae | deferred | Audit notes only this session |
| K DevOps | Director | Baseline tests, server, checkpoint discipline |
| L Auditor | Director (self-audit w/ evidence) | Every claim cites a check; independent review pending |

## Coordination protocol (when multiple sessions exist)

1. One branch per session; never commit to another session's branch.
2. Coordinate through `TASK_REGISTRY.json` status + git history, not chat.
3. Overlapping files (`.htaccess`, nav, CSS): announce intent in SESSION_LOG.md
   before editing; keep changes additive and narrow.
4. Conflicts resolved by Director review of deliverables, not by claims.

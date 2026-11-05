# RESUME_INSTRUCTIONS.md — Cold-start recovery (no conversation history needed)

1. `cd /home/user/website && git status && git log --oneline -3`
   Confirm branch `arena/bfcb8601-website`.
2. Read `orr-project/CURRENT_CHECKPOINT.json`, then `PROJECT_STATE.md`,
   then `TASK_REGISTRY.json` (pending/in_progress/blocked).
3. Read `orr-project/BLOCKERS.md` — B-001 shapes everything.
4. Restore environment:
   - `npm install` (node_modules excluded from snapshots; needed for
     esbuild-based suites and any build).
   - `HOST=0.0.0.0 PORT=8080 node tools/static-server.mjs` via start_process
     for the live preview (name: Website).
   - Audit clone (outside repo, may not persist):
     `git clone --depth 1 --branch neuro-ml \
       https://github.com/cameronorr2011-beep/game-website.git \
       /home/user/game-website-audit`
5. Verify baseline: `node tools/test_all.mjs` (27 py tests) and spot-check
   `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/`.
6. Pick the highest-priority `pending` task whose dependencies are `done`
   and which B-001 does not block. Update its status; do the work; run tests;
   update checkpoint + session log; commit + push.
7. Never claim background progress across sessions: if no process was alive,
   state the gap and re-verify state before continuing.

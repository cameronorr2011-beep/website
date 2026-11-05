# DEPLOYMENT_STATUS.md

## Corporate site (this repo → orrbiologicals.com)

- Hosting: Hostinger, Apache/LiteSpeed static, GitHub-to-hosting workflow.
- Config: `.htaccess` (canonical https non-www, clean .html routes, dotfile +
  tooling blocks, legacy redirects). Inspected, not yet modified except D-003
  (pending commit).
- Production deploys from `main`; this session works on
  `arena/bfcb8601-website` and must NOT push to `main` directly — merge via PR
  after review.
- Local preview: `HOST=0.0.0.0 PORT=8080 node tools/static-server.mjs` → 200s
  verified. Note: static-server does NOT apply .htaccess semantics; Apache
  behavior for new rules must be reasoned carefully, not assumed.

## NeuroML app (game-website repo → Vercel)

- Deployment `game-website-git-neuro-ml-orr5.vercel.app` referenced by
  directive; not probed from sandbox (vercel.app egress blocked). No changes
  made to that repo this session.

## Release discipline

- No production deploys from session branches.
- `.env` never committed; no secrets in repo (`.gitignore` covers .env*).
- Session branch must be pushed regularly as the backup mechanism.

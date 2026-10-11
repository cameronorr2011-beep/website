# Optional local game backend

This directory contains a small, optional development backend for the static
game. It is deliberately separate from the browser lab UI: the deployed site
continues to run locally in the browser and does not depend on this service.

The service uses only Node.js built-ins and stores JSON files below
`server/data/`. Runtime JSON and temporary files are ignored by Git. It binds
to `127.0.0.1:8787` by default:

```powershell
npm run server
```

Use `PORT=0` (or an equivalent environment setting) when embedding the server
in a local test. `HOST` and `PORT` can be set for other local development
configurations, but the default is loopback-only.

## API

All responses are JSON. Request bodies must be JSON objects and are limited to
64 KiB.

- `GET /health` returns `{ "ok": true, ... }`.
- `GET /api/state/:playerId` returns the saved state envelope, or `404` when
  the player has no saved state.
- `PUT /api/state/:playerId` validates and persists a JSON object. The response
  includes `playerId`, `state`, and `updatedAt`.
- `POST /api/events` validates a JSON event object and requires an
  `Idempotency-Key` header. Repeating the same key and body returns the same
  `eventId` with `duplicate: true`; reusing a key for a different body returns
  `409`.

The service has **no authentication**, authorization, rate limiting, or
production database guarantees. It is **not production-ready** and should not
be exposed beyond a trusted development machine. The deployed static site
remains local-only until a host with secure persistence and the required
operational controls is configured.

## Test

The server test starts an isolated instance on an ephemeral port and uses a
temporary data directory, so it does not write runtime records into the working
tree:

```powershell
npm run test:server
```

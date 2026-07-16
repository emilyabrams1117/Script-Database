---
name: verify
description: How to run and drive Script Database (Next.js app in app/) to observe a change actually working.
---

# Verifying Script Database

Single Next.js 16 app lives in `app/`, backed by a real Neon Postgres DB (connection string
already in `app/.env` — this is the live dataset, ~4,700+ plays, not a throwaway local DB).
There's no separate staging DB, so verification runs against production data — read-only checks
are free; anything that writes (create/update/delete a play, re-extraction) actually mutates real
rows, so prefer exercising it against a row you can identify and don't mind touching.

## Launch

```bash
cd app
npm run dev          # starts on http://localhost:3000, backed by the real Neon DB
```

Confirm it's up: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/plays` → `200`.

Check server-side errors via the dev server's stdout/stderr (redirect to a file when launching
in the background, e.g. `npm run dev > /tmp/nextdev.log 2>&1 &`, then `grep -i error` on it) —
Server Action errors and Prisma errors land there, not in the browser console.

## Drive it

This is a browser app (server-rendered pages + forms wired to Server Actions in
`lib/actions.ts`), so click through it rather than curling — Server Action form submissions use
Next's encoded action-reference mechanism and can't be faked with a plain `curl -X POST`.

Playwright is not a project dependency (keep it that way — install on demand, don't add to
`package.json`):
```bash
cd app
npm install --no-save playwright
npx playwright install chromium   # only needed once per machine; ~170MB download
```
Then drive it with a throwaway script (`node some_script.js` using `require("playwright")`),
watching `page.on("console")`, `page.on("pageerror")`, and `page.on("response")` (status >= 400)
for failures. Delete the script when done — it's scratch, not a fixture.

## Known non-issues (don't re-report these)

- The Drive PDF preview `<iframe>` on `/plays/[id]` hits `https://drive.google.com/file/.../preview`
  and gets a 401 in this environment (no browser-side Google auth) — pre-existing, unrelated to
  app code.
- As of 2026-07, 0 of ~4,680 plays have `genre` set in the real DB, so genre-dependent UI (the
  Genre filter dropdown, genre badges on cards) will look empty in manual testing. Not a bug —
  it's the actual data state. `themes` is similarly empty until extraction has been run.
- `npm run lint` has 5 pre-existing errors in `app/layout.tsx` and `components/FilterBar.tsx`
  (`no-html-link-for-pages` on plain `<a>` tags) that predate any feature work — check
  `git stash` + rerun if you're unsure whether you introduced a lint error.

## Extraction feature (lib/extraction.ts) specifically

Auto-fills cast counts/genre/synopsis/themes from a play's linked Drive PDF via Claude, triggered
from `createPlay`/`updatePlay`/`reextractPlay` in `lib/actions.ts`. Requires
`ANTHROPIC_API_KEY` and `GOOGLE_SERVICE_ACCOUNT_JSON` (base64-encoded service account JSON) in
`app/.env` — both are set as of 2026-07-15. Without them, `runExtraction()` returns
`{ ok: false, reason: "... is not set" }` and the calling Server Action still completes normally
(play still saves/redirects) — intended degraded-mode behavior, not a bug.

**Real gotcha (cost ~30min to find, only surfaced by actually clicking the button, not by
typecheck/lint/import-and-call):** `pdf-parse` v2.x is built on `pdfjs-dist`, which resolves its
worker script relative to its own file location on disk at runtime. Turbopack/webpack bundling
the server code rewrites that path, so it silently fails with `Setting up fake worker failed:
Cannot find module '.../.next/.../pdf.worker.mjs'` — caught by `runExtraction`'s try/catch, so
the Server Action still 200s/redirects fine, and the failure is easy to miss unless you check the
dev server log or the DB afterward. Fixed via `serverExternalPackages: ["pdf-parse",
"pdfjs-dist"]` in `next.config.ts`, which opts them out of bundling. **Requires a dev server
restart after editing `next.config.ts`** — Turbopack doesn't hot-reload config changes.

To test the real extraction path end-to-end: click "Re-extract from PDF" on a play with a
`driveFileId` (query `prisma.play.findFirst({ where: { driveFileId: { not: null } } })` to find
one), then check the dev server log for a `reextractPlay(...)` timing line with no
"Extraction skipped" line above it (a real Claude+Drive round trip takes ~5-10s, not <1s), and
confirm cast counts/genre/synopsis/theme chips actually appear on the play detail page —
checking the DB row directly (`prisma.play.findUnique`) is the most reliable confirmation.

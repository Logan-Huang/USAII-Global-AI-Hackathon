# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AI-Powered Asylum Aid — a web app that gives asylum seekers plain-language guidance, a checklist, next steps, curated legal-aid links, and a map of nearby help. Built for the **USAII Global AI Hackathon 2026** (High School / Community brief / Direction A: Crisis-to-Action Translator). Submission deadline **2026-06-21**; `docs/` are graded deliverables.

## Commands

```
npm install          # install deps (Leaflet is also vendored in public/, so the app runs without this)
npm start            # serve at http://127.0.0.1:3000  (requires ANTHROPIC_API_KEY in .env, or it exits)
npm run dev          # same, with --watch
```

Set up the key first: `copy .env.example .env`, then paste a key. The model defaults to `claude-opus-4-8`; set `CLAUDE_MODEL=claude-sonnet-4-6` (or `claude-haiku-4-5`) in `.env` to cut cost while developing.

### Testing / verification (there is no test framework)

`server/server.js` exports the Express `app` and only calls `listen()` under `require.main`, so endpoints are tested in-process with a throwaway port:

```bash
node --check server/server.js            # syntax-check any file
node -e 'process.env.ANTHROPIC_API_KEY="x"; const app=require("./server/server");
  const s=app.listen(0,"127.0.0.1",async()=>{ const b="http://127.0.0.1:"+s.address().port;
  console.log(await (await fetch(b+"/api/resources?country=US")).json()); s.close(); });'
```

- `/api/resources`, `/api/geocode`, `/api/places` need **no API key** — `geocode`/`places` hit real OpenStreetMap/Open-Meteo services, so these are the way to verify the map path live.
- `/api/chat` needs a real key. With a dummy key it returns a clean NDJSON `{"type":"error"}` (a 401 → caught → user-safe message); that is the normal way to exercise the error path.
- Pure browser logic (e.g. `renderMarkdown`) can be extracted from `public/app.js` text and `eval`'d in Node to unit-test it without a browser. Leaflet rendering itself is browser-only — verify visually.

### iOS app (`ios/`)

A native SwiftUI client of this same backend (no AI/key on-device). See `ios/README.md`.

```
node scripts/gen-ios-strings.js          # re-derive ios/AsylumAid/Resources/strings.json (100 langs) + copy languages.json
cd ios && xcodegen generate              # regenerate AsylumAid.xcodeproj after adding/removing files (needs `brew install xcodegen`)
open ios/AsylumAid.xcodeproj             # build/run in Xcode (Simulator hits 127.0.0.1:3000 directly)
```

- **No full Xcode here?** The Foundation-only core (models, `LocalizationStore`, `MarkdownRenderer`, `APIClient`/`ChatStream`) compiles and tests with the macOS Swift toolchain — `swiftc <core files> ios/CoreTests/main.swift -o /tmp/coretest && /tmp/coretest`. The SwiftUI views build only in Xcode. `ios/CoreTests/` is dev-only and excluded from the app target.
- **Contract test:** boot the backend in-process (dummy key), save `/api/resources|geocode|places` JSON to `/tmp/contract_*.json`, then `swiftc ios/AsylumAid/Models/Models.swift ios/CoreTests/contract.swift -o /tmp/contract && /tmp/contract` to decode real responses through the app's structs.
- **iOS invariants:** keep the responsible-AI UI (disclaimer banner, privacy notice, map "unverified" label, "Find legal help" authoritative); reuse `/api/chat` (don't add a client-side model); update `docs/AI_TOOLS_AND_DATA.md` if you add any Swift package / Apple framework / data source.

## Architecture (the big picture)

**Local-proxy pattern.** The browser only ever talks to the local Express server; the server holds the Anthropic API key (`.env`, server-side) and calls Claude. The key never reaches the client. The backend is **stateless and storage-free**: chat history lives in browser memory and is sent in full on every request; nothing is persisted or PII-logged.

**Request flow.** `public/app.js` POSTs `{language, profile, messages}` to `/api/chat` → `server/server.js` validates + builds the system prompt + streams Claude's reply as **newline-delimited JSON** (`{"type":"delta"|"done"|"error"}`) → `app.js` reads `response.body` and renders progressively.

### `server/` modules and their roles
- **server.js** — Express wiring, all routes, NDJSON streaming, error handling. Exports `app`.
- **config.js** — env-driven config; **exits immediately if `ANTHROPIC_API_KEY` is missing**. Holds model/effort, rate-limit, and request-size limits.
- **security.js** — Helmet CSP, CORS, per-IP rate limiter, JSON body cap, and `validateChatBody` (sanitizes input, attaches `req.validated`).
- **prompts.js** — `buildSystemPrompt()`: the **safety-critical persona**. Encodes the product's behavior and its responsible-AI posture (legal *information* not *advice*; never adjudicates eligibility; routes case-specific questions to a human attorney; plain/native language; answers grounded in the injected curated resources). Editing tone here changes how the product behaves.
- **claude.js** — Anthropic SDK streaming wrapper. Uses `claude-opus-4-8` with `thinking:{type:"adaptive"}` + `output_config.effort`, and **self-heals**: if the API rejects those enhanced params with a 400, it retries a minimal request. The key is consumed only here (via config).
- **resources.js** — `getResourcesForCountry()`: selects curated authoritative links from `data/resources.json` (US/GB/EU/CA/AU + UNHCR global), normalizing country names/codes/aliases.
- **places.js** — map data: Open-Meteo geocoding + Overpass POI search (**races several Overpass mirrors** for reliability), with in-memory caching and a descriptive User-Agent. Deliberately ranks refugee-relevant places (NGO/charity/social facility/community centre) **above** generic lawyers.

### `public/` frontend (vanilla JS, no framework, no build step)
- **Script load order matters** (set in `index.html`): `countries.js` → `languages.js` → `ui-translations.js` → `i18n.js` → `vendor/leaflet/leaflet.js` → `app.js`.
- **app.js** is a single IIFE holding all state in memory (no `localStorage` for chat). It contains: the NDJSON stream reader, a small **safe markdown renderer** (escape-then-tokenize; keeps blank-line-separated list items inside one `<ol>` so numbering doesn't reset), country-dropdown population via `Intl.DisplayNames`, the Leaflet "Help near you" map, and the resources modal.
- **i18n.js** — UI strings, plus `detectLanguage`/`isRTL`/`buildInitialMessage`. Two layers: a **hand-written, reviewed set** (`en/es/ar/fr/uk`, English canonical) inline in this file, and **machine translations for the other ~95 canonical languages** merged from `window.UI_TRANSLATIONS` (`ui-translations.js`). The merge is **hand-written-wins, then per-key English fallback** via `t()`. `RTL_LANGUAGES` is derived from `window.LANGUAGES` (so every RTL script is covered, not just Arabic). When you add a UI string: add it to all five hand-written objects, then re-run `node scripts/gen-ui-translations.js` so the machine set picks it up (until then the new key falls back to English everywhere else).
- **ui-translations.js** — AUTO-GENERATED (`window.UI_TRANSLATIONS`); do not edit by hand. Generated from `data/ui-strings.json` by `scripts/gen-ui-translations.js`, which asks Claude (Opus 4.8) to translate the canonical English strings into each non-hand-written language, **preserving `{placeholder}` tokens** and falling back to English for any key whose placeholders don't survive. Both `data/ui-strings.json` and `ui-translations.js` are committed so the app runs without a build step or API key.
- **Leaflet is vendored** under `public/vendor/leaflet/` (no CDN) and committed, so the map works without `npm install`.

### API contracts
- `POST /api/chat` → NDJSON stream of `{type:"delta",text}` / `{type:"done"}` / `{type:"error",message}`.
- `GET /api/resources?country=<name|code>` → `{country,name,official[],legalAid[],global[]}`.
- `GET /api/geocode?q=<place>` → `{lat,lon,displayName}`.
- `GET /api/places?lat&lon&radius` → `{count, places:[{name,lat,lon,category,phone,website,address}]}`.

## Conventions & invariants (read before editing)

- **Claude params:** keep `claude-opus-4-8` + adaptive thinking + `effort`. Do **not** add `budget_tokens`, `temperature`, `top_p`, or `top_k` (removed on this model — they 400). Keep the 400-fallback in `claude.js`.
- **Strict CSP** (`security.js`): `scriptSrc 'self'` means **no inline `<script>` and no `on*` handlers** — wire events with `addEventListener`. `img-src` is opened to OSM tile servers for the map; adding any new external call requires a matching CSP change.
- **Responsible-AI invariants** (don't weaken without intent): information not advice; never decide eligibility; always route case-specific questions to a human attorney. Sensitive facts (ethnicity, criminal/legal history) are handled **conversationally and ephemerally — never stored**.
- **Map vs directory:** the OSM map is *unverified community data* and is labeled as such; the curated **"Find legal help"** directory is the authoritative path. Preserve that priority and the NGO-before-generic-lawyer ranking in `places.js`.
- **Disclosure is graded:** `docs/AI_TOOLS_AND_DATA.md` must stay accurate to what the app actually uses (AI models, APIs, libraries, data sources). Update it whenever you add or remove a service or library.

## Docs map
`README.md` (entry point + setup) · `SECURITY.md` (threat model + "before you host publicly" hardening checklist) · `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/HUMAN_IN_THE_LOOP.md`, `docs/RESPONSIBLE_AI.md`, `docs/AI_TOOLS_AND_DATA.md`, `docs/PITCH_VIDEO_SCRIPT.md` (graded submission artifacts) · `ios/README.md` (native iOS app — build/run/architecture).

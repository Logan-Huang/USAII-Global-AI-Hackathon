# Architecture: AI-Powered Asylum Aid

## Overview

The application is a three-layer system: a browser-based frontend, a local Node.js proxy
server, and the Anthropic Claude API. No user data ever leaves the local machine (in the
default configuration), and the API key never reaches the browser.

```
Browser (HTML/CSS/JS)
        |
        | HTTP (localhost only — 127.0.0.1:3000)
        |
Node.js + Express proxy  (server/server.js)
  - holds API key server-side
  - validates / sanitizes input
  - rate-limits per IP (20 req / 60 s)
  - caps body size (16 KB)
        |
        | HTTPS (Anthropic SDK)
        |
Anthropic Claude API  (model: claude-opus-4-8)
  - streaming, adaptive thinking
  - fixed system prompt
        |
        | curated resource list
        |
GET /api/resources  (static JSON from server)
```

---

## Layer 1 — Frontend

**Technology:** Vanilla HTML, CSS, and JavaScript — a single-page application with no build
step required.

**Key components:**

- **Language selector and auto-detect** — supports English (EN), Spanish (ES), Arabic (AR,
  right-to-left layout), French (FR), and Ukrainian (UK). Language detection uses
  `navigator.language` (browser preference) with an optional fallback via the `ipwho.is`
  IP-geolocation API (no key required, HTTPS, user-consented).
- **Intake form** — collects country of origin, current country, and optional context. Sensitive
  fields (ethnicity, religion, legal history) are optional and handled only in the
  conversational turn, never stored.
- **Streaming chat interface** — `POST /api/chat` returns NDJSON (newline-delimited JSON
  chunks); the frontend renders each chunk as it arrives, giving the appearance of the model
  "typing" in real time.
- **Resources panel** — populated from `GET /api/resources`; shows curated authoritative links
  relevant to the user's destination country.
- **Persistent disclaimer banner** — "This is general information, not legal advice. Always
  verify with an official source and consult a qualified attorney."

---

## Layer 2 — Backend Proxy

**Technology:** Node.js (>=18) with Express 5.

**File:** `server/server.js` (entry point), `server/config.js` (environment-driven
configuration).

**Dependencies:**

| Package | Purpose |
|---|---|
| `@anthropic-ai/sdk ^0.104.1` | Anthropic API client (streaming) |
| `express ^5.2.1` | HTTP server and routing |
| `helmet ^8.2.0` | Security headers (CSP, HSTS, X-Frame-Options, etc.) |
| `cors ^2.8.6` | Cross-origin policy (locked to configured origin) |
| `express-rate-limit ^8.5.2` | Per-IP rate limiting |
| `dotenv ^17.4.2` | Loads `.env` into `process.env` |

**Security controls (all in place):**

- API key loaded from `.env` (gitignored); never in source, never sent to the browser.
- Server binds to `127.0.0.1:3000` by default (localhost only).
- Request body capped at 16 KB.
- Per-IP rate limit: 20 requests per 60-second window.
- Conversation history capped at 30 messages; single messages capped at 4,000 characters;
  profile fields capped at 200 characters.
- Helmet middleware sets security headers on every response.
- CORS restricted to the configured `ALLOWED_ORIGIN` (empty = same-origin localhost).
- No PII logging. No user data written to disk.

**Routes:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Streams the model's reply as NDJSON |
| `GET` | `/api/resources` | Returns curated authoritative resource links |

---

## Layer 3 — AI (Anthropic Claude)

**Model:** `claude-opus-4-8` (default). Configurable via `CLAUDE_MODEL` in `.env`;
`claude-sonnet-4-6` or `claude-haiku-4-5` can be used for development to reduce cost.

**Mode:** Streaming with adaptive thinking enabled via the Anthropic SDK.

**System prompt (enforced, fixed):**

The system prompt instructs the model to:

1. Reply in the same language the user writes in (multilingual by default).
2. Use plain language — no legal jargon without an immediate plain-language definition.
3. Structure output: a brief explanation, a numbered checklist, and a "next steps" section.
4. Ground every claim in the curated authoritative sources provided; cite sources explicitly.
5. Refuse to determine eligibility or provide legal advice — always state this clearly and
   refer the user to a qualified attorney.
6. Treat all personal details shared by the user (ethnicity, religion, political opinion) as
   confidential and relevant only to personalizing guidance, never to be repeated
   unnecessarily.

**Input → AI → Output flow:**

```
User types situation
        |
        v
Frontend: POST /api/chat
  body: { messages: [...], profile: { countryOfOrigin, currentCountry, context } }
        |
        v
Backend: validate + sanitize input
  - strip fields exceeding character limits
  - cap message array length
  - reject oversized bodies (16 KB limit)
        |
        v
Anthropic SDK: stream request to claude-opus-4-8
  - system prompt prepended
  - curated resource list included as context
  - adaptive thinking enabled
        |
        v
Backend: forward NDJSON chunks to browser as they arrive
        |
        v
Frontend: render each chunk — plain-language explanation,
          numbered checklist, next steps, cited resource links,
          "see an attorney" call-to-action
```

---

## Why AI? (Could Simpler AI Help?)

> This section directly addresses the HS rubric criterion: "Why AI? Could simpler AI help?"

See [PROJECT.md — Why AI?](PROJECT.md#why-ai-could-simpler-ai-help) for the full analysis.
Summary for architectural context:

A static FAQ, keyword search, or decision-tree bot was considered and rejected because asylum
situations vary across the five Convention grounds, dozens of country-pairs, and continuously
shifting policy conditions. No enumerable rule set can cover the space.

An LLM is architecturally necessary for:

1. **Real-time translation of legal language to plain language** — in the user's own language.
2. **Personalization across an open-ended situation space** — no decision tree can enumerate
   every country-of-origin × destination × ground combination.
3. **Synthesis** — assembling scattered, multi-source information into a coherent, ordered
   checklist on the fly.

The backend enforces the guardrails (grounding, plain-language instruction, human-in-the-loop
referral) via the fixed system prompt, so the AI's role is bounded: it explains and orients;
human attorneys decide.

---

## Data Architecture

**Curated resource list (server-side, static):**

The server maintains a curated JSON structure of authoritative links, keyed by destination
country / region:

- UNHCR: help.unhcr.org
- US: USCIS, EOIR/DOJ, ImmigrationLawHelp.org, LawHelp.org, ASAP, RAICES, ILRC
- UK: GOV.UK (claim asylum), Refugee Council UK
- EU: EUAA, AIDA (Asylum Information Database)
- Canada: IRCC
- Australia: Refugee Council of Australia, RACS

All sources are public. No web scraping; links only.

**User data:**

- No persistent storage. The backend is stateless.
- Chat history exists only in browser memory for the duration of the session.
- No PII is logged server-side.
- The demo uses a synthetic persona (not real user data). See [AI_TOOLS_AND_DATA.md](AI_TOOLS_AND_DATA.md).

**Optional geolocation (user-consented):**

The frontend may request `navigator.geolocation` to pre-fill the current-country field.
This is optional, user-consented, and never sent to any third party. As a secondary fallback,
`ipwho.is` provides an IP-to-country hint (HTTPS, no API key, no account required). An
optional "services near you" feature may use OpenStreetMap Nominatim + Overpass API
(attribution: "© OpenStreetMap contributors"); this is secondary to the curated directories.

---

## Configuration Reference

All tunables live in `.env` (see `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | (required) | Anthropic API key — server-side only |
| `CLAUDE_MODEL` | `claude-opus-4-8` | Model ID |
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `3000` | Bind port |
| `ALLOWED_ORIGIN` | (empty) | CORS origin(s), comma-separated |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window in ms |
| `RATE_LIMIT_MAX` | `20` | Max requests per IP per window |

---

*See also: [PROJECT.md](PROJECT.md) | [HUMAN_IN_THE_LOOP.md](HUMAN_IN_THE_LOOP.md) | [RESPONSIBLE_AI.md](RESPONSIBLE_AI.md) | [AI_TOOLS_AND_DATA.md](AI_TOOLS_AND_DATA.md) | [SECURITY.md](../SECURITY.md)*

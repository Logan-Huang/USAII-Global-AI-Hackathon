# AI Tools and Data Disclosure

**This document is a mandatory hackathon submission requirement.**  
All AI tools, APIs, models, and data sources used in this project are disclosed below.

---

## AI Models and Tools

### 1. Anthropic Claude — `claude-opus-4-8`

- **Role:** Core assistant. Translates legal information into plain language, generates the
  personalized checklist and next steps, and routes users to human legal help.
- **Access:** Anthropic API, official `@anthropic-ai/sdk` npm package (v0.104.1+).
- **Mode:** Streaming with adaptive thinking.
- **Invoked by:** The backend proxy (`server/server.js`) via `POST /api/chat`. The model is
  never called directly from the browser; the API key is server-side only.
- **System prompt:** Fixed; enforces plain language, multilingual replies, source grounding,
  and human-in-the-loop guardrails.

### 2. Claude Code (Anthropic)

- **Role:** AI coding assistant used during development to help build and debug the
  application.
- **Scope:** Used to generate, review, and refactor code in the repository. Not part of the
  runtime application.

### [TODO: list any other AI tools the team used during development or for any other purpose]

---

## Public APIs

### Browser / Runtime APIs — used in the shipped app (no account or key)

| API | Purpose | Notes |
|---|---|---|
| `navigator.language` | Detect the user's browser language to auto-select the UI language | Client-side; the user can override with the language selector |
| `navigator.geolocation` | Optional "Use my location" button on the map | Client-side; user-consented; coordinates are used only to query nearby places and are never stored |

### Third-party services — used by the "Help near you" map (free, no API key)

All are called **server-side** by the local proxy (`server/places.js`), which sends a descriptive
`User-Agent`, caches results, and rate-limits, so usage policies are respected and the browser
never calls them directly.

| Service | Purpose | Notes / Attribution |
|---|---|---|
| Open-Meteo Geocoding API | Convert the user's city/area into map coordinates | `geocoding-api.open-meteo.com`; free, key-less (chosen over Nominatim, which blocks many server IPs) |
| OpenStreetMap Overpass API | Find nearby NGOs, social facilities, charities, community centres, and legal offices | `overpass-api.de` (with a mirror fallback); "© OpenStreetMap contributors" |
| OpenStreetMap tile servers | Map tiles rendered in the browser | `*.tile.openstreetmap.org`; "© OpenStreetMap contributors" (shown on the map) |

### Open-source libraries (bundled locally, no CDN)

| Library | Purpose | License |
|---|---|---|
| Leaflet | Interactive map rendering | BSD-2-Clause (vendored in `public/vendor/leaflet/`) |
| Express, Helmet, express-rate-limit, CORS, dotenv | Backend server + security | MIT / ISC (see `package.json`) |
| `@anthropic-ai/sdk` | Calls to Claude | MIT |

### Not used
- **Nominatim** — evaluated for geocoding but it blocks many server IPs; replaced with Open-Meteo.
- **ipwho.is** — not used; the UI language comes from the browser, and the map is centered from the user's typed city or their consented device location, which avoids sending the user's IP to a third party.

The map shows **community-mapped, unverified** places and is clearly labeled as such. The curated
authoritative directory (`GET /api/resources` — "Find legal help") remains the **primary** path to
vetted asylum help.

---

## Data Sources

All data sources used are publicly available. No proprietary, licensed, or private datasets
were used.

### Curated Authoritative Resource Directory

The server maintains a curated list of authoritative official and legal-aid links. These are
linked to, not scraped or copied.

| Source | URL | Region |
|---|---|---|
| UNHCR Help Portal | help.unhcr.org | Global |
| USCIS | uscis.gov | United States |
| EOIR / DOJ | justice.gov/eoir | United States |
| ImmigrationLawHelp.org | immigrationlawhelp.org | United States |
| LawHelp.org | lawhelp.org | United States |
| ASAP — Asylum Seeker Advocacy Project | asaptogether.org | United States |
| RAICES | raicestexas.org | United States |
| ILRC — Immigrant Legal Resource Center | ilrc.org | United States |
| GOV.UK — Claim Asylum | gov.uk/claim-asylum | United Kingdom |
| Refugee Council UK | refugeecouncil.org.uk | United Kingdom |
| EUAA — EU Agency for Asylum | euaa.europa.eu | European Union |
| AIDA — Asylum Information Database | asylumineurope.org | European Union |
| IRCC — Immigration, Refugees and Citizenship Canada | canada.ca/en/immigration | Canada |
| Refugee Council of Australia | refugeecouncil.org.au | Australia |
| RACS — Refugee Advice & Casework Service | racs.org.au | Australia |

> [TODO: before submitting, confirm each URL in this table resolves to the correct authoritative
> page. URLs can change; a broken link in a mandatory disclosure document reflects poorly.]

---

## Data Handling

- **No private or sensitive datasets were used** at any stage of development or demonstration.
- **The demo uses a synthetic persona.** The example user shown in all demos and the pitch
  video ("Amina," a fictional asylum seeker) is entirely fictional. No real person's data,
  story, or identity was used.
- **No user data is stored.** The backend is stateless. Chat history exists only in browser
  memory for the duration of a session and is discarded when the tab is closed.
- **No PII is logged** server-side. IP addresses are used only for in-memory rate limiting
  and are not persisted.

---

*See also: [RESPONSIBLE_AI.md](RESPONSIBLE_AI.md) | [ARCHITECTURE.md](ARCHITECTURE.md) | [SECURITY.md](../SECURITY.md)*

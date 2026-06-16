# AI-Powered Asylum Aid

**USAII Global AI Hackathon 2026 — High School Track**  
Brief: Community — "Help is Hard to Find — Make Support Obvious."  
Direction A: Crisis-to-Action Translator

> **General information, not legal advice.** This application provides legal information to
> help you understand the asylum process. It is not a lawyer. It does not provide legal advice.
> It does not determine eligibility. Always verify information with an official source and
> consult a qualified immigration attorney before making decisions about your case.

---

## Prerequisites (Team TODOs)

Before submitting, the team must complete the following:

- **Qualifier approval code:** DONT LEAK THIS
- **Team of 2–5 members:** 
  - Team member 1: Yuvraj Manchanda
  - Team member 2: Logan Huang
  - Team member 3: Rohan Bhamidipati
  - Team member 4: Finn Gorsline

---

## Problem

Asylum seekers face three interlocking barriers: complex, multi-jurisdiction legal systems;
language barriers; and fear of disclosing personal information. The result is an entitlement
gap — people who qualify for asylum protection never file because they cannot navigate the
process.

## Solution

A web application — plus **native iOS** ([`ios/`](ios/README.md)) and **Android**
([`android/`](android/README.md)) apps that share the same backend — where the user enters
their country of origin and current country, then chats with an AI assistant that:

1. Explains the asylum process in plain language, in the user's own language.
2. Delivers a personalized, step-by-step checklist and immediate next steps.
3. Links to authoritative official and legal-aid resources for their destination.
4. Routes them to qualified human attorneys and legal-aid organizations.
5. Shows an interactive map of nearby help (NGOs, legal aid, community services) around their location.

The application is **not a lawyer**. It provides legal information, not legal advice. A human
attorney makes all case-specific decisions. See [docs/HUMAN_IN_THE_LOOP.md](docs/HUMAN_IN_THE_LOOP.md).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend (web) | Vanilla HTML / CSS / JavaScript (single-page app, no build step) |
| Frontend (iOS) | Native Swift / SwiftUI client of the same backend ([`ios/`](ios/README.md)); MapKit + CoreLocation |
| Frontend (Android) | Native Kotlin / Jetpack Compose client of the same backend ([`android/`](android/README.md)); osmdroid (OpenStreetMap) + LocationManager |
| Backend | Node.js >=18, Express 5 |
| Security headers | Helmet |
| Rate limiting | express-rate-limit |
| Maps | Leaflet (vendored, no CDN) + OpenStreetMap tiles & Overpass API |
| Geocoding | Open-Meteo Geocoding API |
| AI | Anthropic Claude `claude-opus-4-8` via `@anthropic-ai/sdk` |
| Env management | dotenv |

Languages supported: **the AI guidance responds in ~100 languages** chosen by relevance to asylum seekers (see `data/languages.json`), selectable from the language picker. The **app interface (buttons, labels) is fully translated into 5** — English (EN), Spanish (ES), Arabic (AR, RTL), French (FR), Ukrainian (UK) — and falls back to English for the rest while the guidance itself stays in the user's chosen language. RTL layout is applied automatically for right-to-left scripts (Arabic, Dari, Pashto, Persian, Urdu, Sorani Kurdish, Sindhi, Uyghur, Hebrew, Syriac).

---

## Setup

### 1. Install dependencies

```
npm install
```

### 2. Configure your API key

```
copy .env.example .env
```

Open `.env` and replace the placeholder with your **new, rotated** Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-your-new-rotated-key-here
```

Set a spend limit on the key in the [Anthropic Console](https://console.anthropic.com) before
running.

### 3. Start the server

```
npm start
```

### 4. Open the app

Open your browser to:

```
http://127.0.0.1:3000
```

### Development tip — use a cheaper model to reduce cost

While developing and testing, change `CLAUDE_MODEL` in `.env` to save money:

```
CLAUDE_MODEL=claude-sonnet-4-6   # ~half the cost of Opus
# or
CLAUDE_MODEL=claude-haiku-4-5    # cheapest and fastest
```

Switch back to `claude-opus-4-8` for the demo recording and final submission.

### 5. (Optional) Run the native iOS app

A native SwiftUI app lives in [`ios/`](ios/README.md). Start the backend (`npm start`), then
open `ios/AsylumAid.xcodeproj` in **Xcode**, pick an iOS Simulator, and Run — the Simulator
reaches `127.0.0.1:3000` directly (no signing or deployment needed). Full instructions,
including running on a physical device, are in [ios/README.md](ios/README.md).

### 6. (Optional) Run the native Android app

A native Kotlin / Jetpack Compose app lives in [`android/`](android/README.md). Start the
backend (`npm start`), then open `android/` in **Android Studio**, pick an emulator (API 26+),
and Run — the emulator reaches the host's backend at `10.0.2.2:3000` (the default base URL; no
signing or deployment needed). Full instructions, the migration blueprint, and how to run on a
physical device are in [android/README.md](android/README.md) and
[android/MIGRATION_BLUEPRINT.md](android/MIGRATION_BLUEPRINT.md).

---

## Security Notes

- **The API key is never committed.** `.env` is listed in `.gitignore`. Never commit it.
- **The API key never reaches the browser.** All Anthropic API calls are made server-side by
  the proxy. The browser only talks to `127.0.0.1:3000`.
- **Localhost only by default.** The server binds to `127.0.0.1`. Nothing leaves your machine
  except the HTTPS call to the Anthropic API.
- **Rate limited.** 20 requests per IP per 60-second window by default.
- **If you accidentally commit the key, rotate it immediately** in the Anthropic Console.

For the full threat model and a "before you host this publicly" hardening checklist, see
[SECURITY.md](SECURITY.md).

---

## Documentation

| Document | Description |
|---|---|
| [docs/PROJECT.md](docs/PROJECT.md) | Problem, solution, impact, and "Why AI?" |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture and input-AI-output flow |
| [docs/HUMAN_IN_THE_LOOP.md](docs/HUMAN_IN_THE_LOOP.md) | Human-in-the-loop design |
| [docs/RESPONSIBLE_AI.md](docs/RESPONSIBLE_AI.md) | Risk register and responsible AI mitigations |
| [docs/AI_TOOLS_AND_DATA.md](docs/AI_TOOLS_AND_DATA.md) | **Mandatory hackathon disclosure** — all AI tools, APIs, and data sources |
| [docs/PITCH_VIDEO_SCRIPT.md](docs/PITCH_VIDEO_SCRIPT.md) | Beat-by-beat script for the pitch video |
| [ios/README.md](ios/README.md) | Native iOS (SwiftUI) app — build, run, and architecture |
| [android/README.md](android/README.md) | Native Android (Jetpack Compose) app — build, run, and architecture |
| [android/MIGRATION_BLUEPRINT.md](android/MIGRATION_BLUEPRINT.md) | How the web app was isolated and ported to a native Android client |
| [SECURITY.md](SECURITY.md) | Threat model and hardening checklist |

**Mandatory disclosure:** [docs/AI_TOOLS_AND_DATA.md](docs/AI_TOOLS_AND_DATA.md) lists every
AI tool, model, API, and data source used in this project, as required by the hackathon rules.

---

## License

MIT — see `package.json`. [TODO: add author name(s).]

---

> **Disclaimer:** AI-Powered Asylum Aid provides general legal information only. It is not a
> lawyer and does not provide legal advice. It does not determine whether you qualify for
> asylum. Always verify information with an official source (such as USCIS, UNHCR, or your
> country's asylum authority) and consult a qualified immigration attorney before making any
> decisions about your case. Your information is not shared with any government.

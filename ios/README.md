# Asylum Aid — iOS app

A native **SwiftUI** client for AI-Powered Asylum Aid. It talks to the same Express backend
as the web app, so the Anthropic API key never leaves the server and every responsible-AI
guardrail (information not advice, attorney routing, no data storage) is preserved.

Feature parity with the web app: language gate (100 languages + RTL), intake form, streaming
chat with safe markdown, the curated "Find legal help" directory, and the MapKit "Help near you"
map.

## Requirements

- **Full Xcode** (App Store) — Command Line Tools alone cannot build a SwiftUI app.
  After installing: `sudo xcode-select -s /Applications/Xcode.app`
- iOS **16.0+** Simulator or device.
- The backend running (this repo's root): `npm install` then `npm start` (needs
  `ANTHROPIC_API_KEY` in `.env`).

## Run it (Simulator — the easy path)

1. Start the backend from the repo root:
   ```bash
   npm start          # serves http://127.0.0.1:3000
   ```
2. Open the project and run:
   ```bash
   open ios/AsylumAid.xcodeproj
   ```
   Pick an iOS Simulator (e.g. iPhone 15) and press **▶︎ Run** (⌘R).

That's it. The Simulator reaches the Mac's `127.0.0.1:3000` directly, and the app's
`NSAllowsLocalNetworking` ATS exception permits the plain-HTTP loopback call — **no signing
or backend deployment needed**.

Smoke test: pick a language (try **Arabic** for RTL) → fill the intake form → send → watch the
reply stream in → open **Find legal help** → open the **map** → **Use my location**.

## Run it on a physical device

1. In **Signing & Capabilities**, select your Apple Team (free account is fine).
2. Start the backend bound to your LAN so the phone can reach it:
   ```bash
   HOST=0.0.0.0 npm start      # if server/config.js reads HOST; otherwise see note below
   ```
3. Set the base URL to your Mac's LAN IP in `ios/AsylumAid/App/AppConfig.swift`:
   ```swift
   static let baseURL = URL(string: "http://192.168.x.y:3000")!
   ```
   (For a non-loopback HTTP host you may need to widen the ATS exception, or front the
   backend with HTTPS.)

> If the backend doesn't yet honour a `HOST` env var, bind it to `0.0.0.0` in
> `server/config.js` (one line) — or simply deploy the backend behind HTTPS and point
> `AppConfig.baseURL` at it.

## Project layout

```
ios/
  project.yml                 # XcodeGen spec (source of truth for the project)
  AsylumAid.xcodeproj/        # generated; committed so you can just open it
  AsylumAid/
    App/        AsylumAidApp.swift, AppConfig.swift, Info.plist
    State/      AppState.swift                 (in-memory only; nothing persisted)
    Models/     Models.swift                   (Codable wire types)
    Networking/ APIClient.swift, ChatStream.swift   (URLSession; NDJSON via bytes.lines)
    Localization/ LocalizationStore.swift, Countries.swift
    Rendering/  MarkdownRenderer.swift         (safe markdown → blocks)
    Theme/      Theme.swift                    (brand palette from styles.css)
    Views/      RootView, LanguageGate, IntakeForm, Chat, MessageBubble, Resources, MapHelp
    Resources/  strings.json, languages.json, Assets.xcassets   (bundled, generated)
  CoreTests/    main.swift, contract.swift, make-icon.swift    (dev-only; not in the app target)
```

## Regenerating

- **Xcode project** (after adding/removing/renaming files):
  ```bash
  brew install xcodegen        # once
  cd ios && xcodegen generate
  ```
- **Bundled UI strings** (after editing the web UI strings): from the repo root
  ```bash
  node scripts/gen-ios-strings.js
  ```
  This re-derives `ios/AsylumAid/Resources/strings.json` (all 100 languages, hand-written
  wins → machine → English fallback) and copies `data/languages.json`.

## Verifying the logic without Xcode

The Foundation-only core (parser, i18n, markdown, models) compiles and tests with the macOS
Swift toolchain — no iOS SDK needed:

```bash
# unit tests for parser / i18n / markdown / buildInitialMessage / JSON
swiftc ios/AsylumAid/App/AppConfig.swift ios/AsylumAid/Models/Models.swift \
       ios/AsylumAid/Localization/LocalizationStore.swift \
       ios/AsylumAid/Rendering/MarkdownRenderer.swift \
       ios/AsylumAid/Networking/APIClient.swift ios/AsylumAid/Networking/ChatStream.swift \
       ios/CoreTests/main.swift -o /tmp/coretest && /tmp/coretest

# contract test: decode REAL backend responses through the app's structs
#   (first capture them by booting the backend — see CLAUDE.md verification snippet)
swiftc ios/AsylumAid/Models/Models.swift ios/CoreTests/contract.swift -o /tmp/contract && /tmp/contract
```

The SwiftUI views themselves build only in Xcode.

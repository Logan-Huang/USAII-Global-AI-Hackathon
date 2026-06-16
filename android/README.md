# Asylum Aid — Android app

A native **Kotlin + Jetpack Compose** client for AI-Powered Asylum Aid. It talks to the same
Express backend as the web and iOS apps, so the Anthropic API key never leaves the server and
every responsible-AI guardrail (information not advice, attorney routing, no data storage) is
preserved.

Feature parity with the web/iOS apps: language gate (100 languages + RTL), intake form,
streaming chat with safe markdown, the curated "Find legal help" directory, and the
**OpenStreetMap** "Help near you" map.

> See [`MIGRATION_BLUEPRINT.md`](MIGRATION_BLUEPRINT.md) for how the web app was isolated and
> what had to be created for a mobile client.

## Requirements

- **Android Studio** (Ladybug 2024.2.1+) — it bundles a compatible **JDK 17** and the Android
  SDK. (The Android Gradle Plugin needs JDK 17; a newer system JDK won't work for the build.)
- Android SDK Platform **35**; an emulator (API 26+) or a device on Android **8.0+**.
- The backend running from the repo root: `npm install` then `npm start` (needs
  `ANTHROPIC_API_KEY` in `.env`). It serves `http://127.0.0.1:3000`.

## Run it (emulator — the easy path)

1. Start the backend from the repo root:
   ```bash
   npm start          # serves http://127.0.0.1:3000
   ```
2. Open `android/` in Android Studio. Let it sync Gradle (first sync downloads the Gradle
   distribution and dependencies).
3. Pick an emulator (e.g. Pixel 8, API 35) and press **▶ Run**.

That's it. The emulator reaches the host machine's `127.0.0.1:3000` via the special address
**`10.0.2.2:3000`** — that's the default `AppConfig.BASE_URL`, and the cleartext exception in
`res/xml/network_security_config.xml` permits the plain-HTTP loopback call. **No signing or
backend deployment needed.**

Smoke test: pick a language (try **Arabic** for RTL) → fill the intake form → send → watch the
reply stream in → open **Find legal help** → open the **map** → **Use my location**.

## Run it on a physical device

1. Start the backend bound to your LAN so the phone can reach it:
   ```bash
   HOST=0.0.0.0 npm start
   ```
2. Set the base URL to your computer's LAN IP in `app/src/main/java/org/asylumaid/AppConfig.kt`:
   ```kotlin
   const val BASE_URL = "http://192.168.x.y:3000"
   ```
   and add that host to `res/xml/network_security_config.xml` (or front the backend with HTTPS
   and point `BASE_URL` at it — then no cleartext exception is needed).

## Build from the command line

The Gradle wrapper scripts are committed, but the binary `gradle/wrapper/gradle-wrapper.jar`
is **not** (it can't be authored as text). Generate it once — Android Studio does this on first
sync, or run `gradle wrapper` if you have a system Gradle — then:

```bash
cd android
./gradlew test            # run the pure-JVM unit tests (no emulator)
./gradlew assembleDebug   # build the debug APK
```

## Project layout

```
android/
  settings.gradle.kts, build.gradle.kts, gradle.properties   # Gradle (Kotlin DSL)
  app/
    build.gradle.kts
    src/main/
      AndroidManifest.xml
      assets/        strings.json, languages.json            (generated; committed)
      res/           values (colors/themes/strings), xml (network config, backup), launcher icon
      java/org/asylumaid/
        MainActivity.kt, AppConfig.kt
        model/        Models.kt                               (@Serializable wire types)
        net/          Net.kt, ApiClient.kt, ChatStream.kt     (OkHttp; NDJSON via readUtf8Line)
        i18n/         LocalizationStore.kt, Countries.kt, AssetLoader.kt
        md/           MarkdownRenderer.kt                      (safe markdown → blocks)
        location/     LocationProvider.kt                     (one-shot LocationManager fix)
        state/        AppViewModel.kt                         (in-memory only; nothing persisted)
        ui/           theme/Theme.kt + RootScreen, LanguageGate, IntakeForm, Chat,
                      MessageBubble, Resources, Map (osmdroid)
    src/test/java/org/asylumaid/CoreTest.kt                   (dev-only JVM unit tests)
```

## Regenerating the bundled UI strings

After editing the web UI strings, from the **repo root**:

```bash
node scripts/gen-android-strings.js
```

This re-derives `android/app/src/main/assets/strings.json` (all 100 languages, hand-written
wins → machine → English fallback) and copies `data/languages.json` — the same merge as the
iOS generator. No API key needed; it only re-uses translations already committed in the repo.

## Verifying the logic without an emulator

The pure-Kotlin core (models, i18n, markdown, JSON contracts) is unit-tested on the JVM — no
Android SDK or device needed:

```bash
cd android && ./gradlew test
```

`CoreTest.kt` loads the bundled assets and asserts the 100-language count, the i18n fallback
chain, RTL flags, the markdown quirks (bold stripped, http-only links, ordered list across a
blank line), `buildInitialMessage` placeholder filling, and the wire-history /
optional-field-omission JSON contracts. The Compose UI itself builds in Android Studio.

## Responsible-AI invariants (don't weaken without intent)

- Reuse `POST /api/chat` — never add a client-side model or embed the Anthropic key.
- Keep the disclaimer banner, the intake privacy notice, the map "unverified community data"
  label, and the "Find legal help" directory as the authoritative path.
- No on-device storage of chat/profile (`allowBackup=false`), no analytics, no Google Play
  Services dependency.
- Update `docs/AI_TOOLS_AND_DATA.md` if you add any library / Android framework / data source.
```

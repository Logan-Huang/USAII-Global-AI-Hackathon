'use strict';

/*
 * gen-ui-translations.js — machine-translate the app's UI strings into every
 * language in data/languages.json that is NOT hand-written in public/i18n.js.
 *
 * Why this exists: i18n.js ships hand-written, reviewed translations for a small
 * authoritative set (en, es, ar, fr, uk). The canonical language list, however,
 * carries ~100 codes (UNHCR top refugee/asylum origins). The rest used to fall
 * back to English. This script fills that gap by asking Claude to translate the
 * canonical English UI strings into each remaining language, then writing:
 *
 *   data/ui-strings.json      — durable record of the generated translations
 *                               (source of truth; re-runs reuse it unless --force)
 *   public/ui-translations.js — window.UI_TRANSLATIONS = {...}; loaded by the
 *                               browser before i18n.js, which merges it UNDER the
 *                               hand-written set (hand-written always wins).
 *
 * Usage:
 *   node scripts/gen-ui-translations.js              # fill in only missing languages
 *   node scripts/gen-ui-translations.js --force      # re-translate everything
 *   node scripts/gen-ui-translations.js fa ps so     # only these codes
 *   UI_TRANS_MODEL=claude-sonnet-4-6 node scripts/gen-ui-translations.js
 *
 * Requires ANTHROPIC_API_KEY in .env (server/config.js loads + validates it).
 *
 * NOTE: these are MACHINE translations of safety-critical legal-information UI.
 * They keep the product usable in a speaker's language, but the curated 5 remain
 * the reviewed set. Have a fluent speaker review before relying on any string for
 * a high-stakes deployment.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const config = require('../server/config');
const AnthropicPkg = require('@anthropic-ai/sdk');
const Anthropic = AnthropicPkg.Anthropic || AnthropicPkg.default || AnthropicPkg;

const ROOT = path.join(__dirname, '..');
const I18N_PATH = path.join(ROOT, 'public', 'i18n.js');
const LANGS_PATH = path.join(ROOT, 'data', 'languages.json');
const STRINGS_PATH = path.join(ROOT, 'data', 'ui-strings.json');
const CLIENT_OUT = path.join(ROOT, 'public', 'ui-translations.js');

// Force Opus 4.8 for translation quality (the user's choice), independent of the
// CLAUDE_MODEL that may be set to a cheaper model for app development. Override
// with UI_TRANS_MODEL if you really want a different model.
const MODEL = process.env.UI_TRANS_MODEL || 'claude-opus-4-8';
const CONCURRENCY = parseInt(process.env.UI_TRANS_CONCURRENCY || '6', 10);

const client = new Anthropic({ apiKey: config.apiKey });

// ---- Load the canonical English strings straight out of i18n.js -------------
// i18n.js is a browser IIFE that attaches `i18n` to its global. Run it in a vm
// sandbox with a fake window so we read the exact same `en` object the UI uses —
// no second copy to drift out of sync.
function loadI18n() {
  const code = fs.readFileSync(I18N_PATH, 'utf8');
  const sandbox = { window: {}, navigator: { language: 'en' }, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'i18n.js' });
  const i18n = sandbox.window.i18n;
  if (!i18n || !i18n.translations || !i18n.translations.en) {
    throw new Error('Could not read i18n.translations.en from public/i18n.js');
  }
  return i18n;
}

// Placeholder tokens like {countryOfOrigin} must survive translation verbatim.
function placeholdersIn(obj) {
  const set = new Set();
  const re = /\{[a-zA-Z]+\}/g;
  Object.values(obj).forEach((v) => {
    let m;
    while ((m = re.exec(String(v))) !== null) set.add(m[0]);
  });
  return Array.from(set);
}

function buildPrompt(targetLang, enStrings, tokens) {
  const label = targetLang.native && targetLang.native !== targetLang.name
    ? `${targetLang.name} (native name: ${targetLang.native})`
    : targetLang.name;

  return [
    `You are a professional localizer for a humanitarian web app that helps asylum seekers.`,
    `Translate the UI strings below from English into ${label} [BCP-47/ISO code: ${targetLang.code}]${targetLang.rtl ? ', a right-to-left script' : ''}.`,
    ``,
    `This is safety-critical legal-INFORMATION software. Translate faithfully — do not add, remove, soften, or strengthen meaning. In particular, any disclaimer that this is "general information, not legal advice" must keep exactly that meaning.`,
    ``,
    `Rules:`,
    `1. Output ONLY a single JSON object. No prose, no code fences, no comments.`,
    `2. Use the SAME keys as the input. Translate only the VALUES.`,
    `3. Preserve these placeholder tokens EXACTLY, character for character, untranslated: ${tokens.length ? tokens.join(' ') : '(none)'}. Keep their surrounding spacing.`,
    `4. Write natural, plain, everyday ${targetLang.name} that a frightened newcomer with limited literacy can read — not a stiff word-for-word gloss. Match the short, calm register of the English.`,
    `5. Use the correct, standard script/orthography for ${targetLang.name}. Do NOT transliterate into Latin unless that is the normal way the language is written.`,
    `6. Keep the product name "Asylum Aid" recognizable (translate it to the natural equivalent only if that is clearly more helpful to speakers).`,
    `7. For example placeholders that begin with "e.g."/"e.g.", you may swap the example to one relevant to ${targetLang.name} speakers, keeping the "for example" style.`,
    `8. If a language genuinely has no settled word for a term, use the most widely understood phrasing rather than inventing one.`,
    ``,
    `English UI strings to translate:`,
    JSON.stringify(enStrings, null, 2),
  ].join('\n');
}

function extractJson(text) {
  let s = String(text).trim();
  // Strip ```json ... ``` or ``` ... ``` fences if present.
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // Otherwise grab the outermost {...}.
  if (s[0] !== '{') {
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  }
  return JSON.parse(s);
}

async function translateLanguage(targetLang, enStrings, tokens) {
  const prompt = buildPrompt(targetLang, enStrings, tokens);
  // Minimal, broadly-supported request: opus-4-8 rejects temperature/top_p/top_k,
  // and translation needs no extended thinking — keep it deterministic and cheap.
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = (res.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  const parsed = extractJson(text);

  // Keep only known keys; fill any the model dropped with English (i18n also
  // falls back per-key, but recording English here keeps the file self-describing).
  const out = {};
  const missing = [];
  Object.keys(enStrings).forEach((k) => {
    out[k] = typeof parsed[k] === 'string' && parsed[k].trim() ? parsed[k] : (missing.push(k), enStrings[k]);
  });

  // Verify placeholder tokens survived; if any vanished, fall back to English for
  // that key so a broken template can never reach buildInitialMessage().
  const dropped = [];
  Object.keys(enStrings).forEach((k) => {
    const need = (String(enStrings[k]).match(/\{[a-zA-Z]+\}/g) || []);
    need.forEach((tok) => {
      if (!String(out[k]).includes(tok)) {
        if (out[k] !== enStrings[k]) { out[k] = enStrings[k]; dropped.push(`${k}:${tok}`); }
      }
    });
  });

  return { translations: out, missing, dropped };
}

// Tiny async pool so we don't fire all ~95 requests at once.
async function runPool(items, worker, size) {
  const results = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, lane));
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const onlyCodes = args.filter((a) => !a.startsWith('--'));

  const i18n = loadI18n();
  const enStrings = i18n.translations.en;
  const handWritten = new Set(i18n.supportedLanguages); // en, es, ar, fr, uk
  const tokens = placeholdersIn(enStrings);

  const allLangs = JSON.parse(fs.readFileSync(LANGS_PATH, 'utf8')).languages;

  // Existing generated translations — reused unless --force, so an interrupted or
  // partial run is cheap to resume.
  let existing = {};
  if (fs.existsSync(STRINGS_PATH)) {
    try { existing = JSON.parse(fs.readFileSync(STRINGS_PATH, 'utf8')).translations || {}; }
    catch (_) { existing = {}; }
  }

  // Targets: every canonical language that isn't hand-written in i18n.js.
  let targets = allLangs.filter((l) => !handWritten.has(l.code));
  if (onlyCodes.length) targets = targets.filter((l) => onlyCodes.includes(l.code));
  if (!force) targets = targets.filter((l) => !existing[l.code]);

  console.log(`Model: ${MODEL}`);
  console.log(`Keys per language: ${Object.keys(enStrings).length}  |  placeholders: ${tokens.join(' ') || '(none)'}`);
  console.log(`Hand-written (skipped): ${Array.from(handWritten).join(', ')}`);
  console.log(`To translate now: ${targets.length}${targets.length ? ' → ' + targets.map((l) => l.code).join(', ') : ' (nothing — all present; use --force to redo)'}`);
  if (!targets.length) { writeOutputs(existing, allLangs, handWritten); return; }

  let done = 0;
  const translations = { ...existing };
  await runPool(targets, async (lang) => {
    try {
      const { translations: out, missing, dropped } = await translateLanguage(lang, enStrings, tokens);
      translations[lang.code] = out;
      done++;
      let note = '';
      if (missing.length) note += `  [${missing.length} key(s) kept English: ${missing.slice(0, 4).join(',')}${missing.length > 4 ? '…' : ''}]`;
      if (dropped.length) note += `  [${dropped.length} placeholder fix(es): ${dropped.join(',')}]`;
      console.log(`  ✓ ${String(lang.code).padEnd(5)} ${lang.name}${note}  (${done}/${targets.length})`);
    } catch (err) {
      done++;
      console.error(`  ✗ ${String(lang.code).padEnd(5)} ${lang.name} — ${err.message}  (${done}/${targets.length})`);
    }
  }, CONCURRENCY);

  writeOutputs(translations, allLangs, handWritten);
}

function writeOutputs(translations, allLangs, handWritten) {
  // Order the output by the canonical language order for stable, reviewable diffs.
  const ordered = {};
  allLangs.forEach((l) => {
    if (!handWritten.has(l.code) && translations[l.code]) ordered[l.code] = translations[l.code];
  });

  const record = {
    _comment:
      'AUTO-GENERATED machine translations of the UI strings for languages NOT hand-written in public/i18n.js. ' +
      'Source: the English strings in public/i18n.js. Regenerate with: node scripts/gen-ui-translations.js. ' +
      'public/ui-translations.js is derived from this file. The hand-written set (en, es, ar, fr, uk) lives in i18n.js and always wins.',
    model: MODEL,
    count: Object.keys(ordered).length,
    translations: ordered,
  };
  fs.writeFileSync(STRINGS_PATH, JSON.stringify(record, null, 2) + '\n');

  const client =
    '/* AUTO-GENERATED from data/ui-strings.json by scripts/gen-ui-translations.js — do NOT edit by hand. */\n' +
    '/* Machine translations for languages not hand-written in i18n.js; i18n.js merges these UNDER the curated set. */\n' +
    'window.UI_TRANSLATIONS = ' +
    JSON.stringify(ordered) +
    ';\n';
  fs.writeFileSync(CLIENT_OUT, client);

  console.log(`\nWrote ${STRINGS_PATH} (${record.count} languages)`);
  console.log(`Wrote ${CLIENT_OUT}`);
}

main().catch((err) => {
  console.error('\nFATAL:', err && err.stack ? err.stack : err);
  process.exit(1);
});

'use strict';

/*
 * gen-ios-strings.js — produce a single, dense UI-string table for the iOS app.
 *
 * The web app resolves a UI string at runtime via i18n.t(lang, key):
 *     hand-written[lang][key]  (en, es, ar, fr, uk — always win)
 *       ?? machine[lang][key]  (window.UI_TRANSLATIONS, the other ~95 languages)
 *       ?? hand-written['en'][key]   (per-key English fallback)
 *
 * The iOS app has no JS runtime, so this script pre-resolves that exact merge for
 * EVERY canonical language and writes one flat JSON the app loads from its bundle:
 *
 *     ios/AsylumAid/Resources/strings.json   { "<lang>": { "<key>": "<value>" }, ... }
 *
 * It also copies the canonical language list to the bundle:
 *
 *     ios/AsylumAid/Resources/languages.json  (verbatim copy of data/languages.json)
 *
 * No API key needed — this only re-uses translations already committed in the repo
 * (public/i18n.js + public/ui-translations.js). Re-run after editing UI strings:
 *     node scripts/gen-ios-strings.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const I18N_PATH = path.join(ROOT, 'public', 'i18n.js');
const UI_TRANS_PATH = path.join(ROOT, 'public', 'ui-translations.js');
const LANGS_JS_PATH = path.join(ROOT, 'public', 'languages.js');
const LANGS_JSON_PATH = path.join(ROOT, 'data', 'languages.json');

const OUT_DIR = path.join(ROOT, 'ios', 'AsylumAid', 'Resources');
const STRINGS_OUT = path.join(OUT_DIR, 'strings.json');
const LANGS_OUT = path.join(OUT_DIR, 'languages.json');

// Load the browser i18n stack in a vm sandbox with a fake window, exactly mirroring
// the order index.html loads them in (ui-translations.js + languages.js BEFORE
// i18n.js), so window.i18n.translations ends up merged just like in the browser.
function loadI18n() {
  const sandbox = { window: {}, navigator: { language: 'en' }, console };
  vm.createContext(sandbox);
  for (const p of [UI_TRANS_PATH, LANGS_JS_PATH, I18N_PATH]) {
    vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: path.basename(p) });
  }
  const i18n = sandbox.window.i18n;
  if (!i18n || !i18n.translations || !i18n.translations.en) {
    throw new Error('Could not read window.i18n.translations.en — check load order');
  }
  return i18n;
}

function tokensIn(str) {
  return String(str).match(/\{[a-zA-Z]+\}/g) || [];
}

function main() {
  const i18n = loadI18n();
  const merged = i18n.translations;       // { en:{...}, es:{...}, ...95 machine... }
  const en = merged.en;
  const keys = Object.keys(en);

  const langs = JSON.parse(fs.readFileSync(LANGS_JSON_PATH, 'utf8')).languages;

  const out = {};
  let placeholderFixes = 0;
  let missingLangs = [];

  langs.forEach((lang) => {
    const src = merged[lang.code] || {};
    const dense = {};
    keys.forEach((k) => {
      let v = typeof src[k] === 'string' && src[k].trim() ? src[k] : en[k];
      // Safety net (mirrors gen-ui-translations): if a placeholder token vanished
      // from a translated value, fall back to English so templates never break.
      const need = tokensIn(en[k]);
      if (need.some((tok) => !String(v).includes(tok))) {
        if (v !== en[k]) { v = en[k]; placeholderFixes++; }
      }
      dense[k] = v;
    });
    if (!merged[lang.code]) missingLangs.push(lang.code);
    out[lang.code] = dense;
  });

  // English must always be present and complete.
  if (!out.en) throw new Error('English strings missing from output');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(STRINGS_OUT, JSON.stringify(out) + '\n');
  fs.copyFileSync(LANGS_JSON_PATH, LANGS_OUT);

  console.log(`Languages: ${langs.length}  |  keys/language: ${keys.length}`);
  console.log(`Placeholder fallbacks applied: ${placeholderFixes}`);
  if (missingLangs.length) {
    console.log(`Languages with no translation set (English fallback used): ${missingLangs.join(', ')}`);
  }
  console.log(`Wrote ${path.relative(ROOT, STRINGS_OUT)}`);
  console.log(`Wrote ${path.relative(ROOT, LANGS_OUT)} (copy of data/languages.json)`);
}

main();

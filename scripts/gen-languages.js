'use strict';

// Regenerates public/languages.js from data/languages.json (the single source of
// truth shared with the server). Run after editing the language list:
//     node scripts/gen-languages.js
// The client file is committed so the app still works without a build step.

const fs = require('fs');
const path = require('path');

const data = require('../data/languages.json');
const list = data.languages || [];

const out =
  '/* AUTO-GENERATED from data/languages.json by scripts/gen-languages.js — do NOT edit by hand. */\n' +
  'window.LANGUAGES = ' +
  JSON.stringify(list) +
  ';\n';

const dest = path.join(__dirname, '..', 'public', 'languages.js');
fs.writeFileSync(dest, out);
console.log('Wrote ' + dest + ' with ' + list.length + ' languages.');

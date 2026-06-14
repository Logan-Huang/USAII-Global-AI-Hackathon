'use strict';

const data = require('../data/resources.json');

/**
 * Exact-match alias map: normalized (lowercase, trimmed) input → country code.
 * Using exact match rather than substring/includes to avoid collisions such as
 * "austria"/"australia" matching "us", or "canada" matching "ca" ambiguously.
 *
 * EU covers all 27 current EU member states. UK and its constituent nations
 * map to GB (not EU). EEA/EFTA non-EU states (Norway, Switzerland, Iceland,
 * Liechtenstein) are mapped to EU as a practical fallback per the rationale
 * ("any European country" should surface EU-level resources + global UNHCR links).
 */
const ALIAS_MAP = {
  // ── United States ──────────────────────────────────────────────
  'us':            'US',
  'usa':           'US',
  'u.s.':          'US',
  'u.s.a.':        'US',
  'united states': 'US',
  'united states of america': 'US',
  'america':       'US',

  // ── United Kingdom ─────────────────────────────────────────────
  'uk':             'GB',
  'gb':             'GB',
  'u.k.':           'GB',
  'g.b.':           'GB',
  'great britain':  'GB',
  'britain':        'GB',
  'united kingdom': 'GB',
  'england':        'GB',
  'scotland':       'GB',
  'wales':          'GB',
  'northern ireland': 'GB',

  // ── Canada ─────────────────────────────────────────────────────
  'ca':     'CA',
  'can':    'CA',
  'canada': 'CA',

  // ── Australia ──────────────────────────────────────────────────
  'au':          'AU',
  'aus':         'AU',
  'australia':   'AU',

  // ── European Union (EU-27 member states) ───────────────────────
  'eu':                 'EU',
  'europe':             'EU',
  'european union':     'EU',
  // Austria
  'at':                 'EU',
  'austria':            'EU',
  // Belgium
  'be':                 'EU',
  'belgium':            'EU',
  // Bulgaria
  'bg':                 'EU',
  'bulgaria':           'EU',
  // Croatia
  'hr':                 'EU',
  'croatia':            'EU',
  // Cyprus
  'cy':                 'EU',
  'cyprus':             'EU',
  // Czech Republic / Czechia
  'cz':                 'EU',
  'czech republic':     'EU',
  'czechia':            'EU',
  // Denmark
  'dk':                 'EU',
  'denmark':            'EU',
  // Estonia
  'ee':                 'EU',
  'estonia':            'EU',
  // Finland
  'fi':                 'EU',
  'finland':            'EU',
  // France
  'fr':                 'EU',
  'france':             'EU',
  // Germany
  'de':                 'EU',
  'germany':            'EU',
  'deutschland':        'EU',
  // Greece
  'gr':                 'EU',
  'greece':             'EU',
  // Hungary
  'hu':                 'EU',
  'hungary':            'EU',
  // Ireland
  'ie':                 'EU',
  'ireland':            'EU',
  'republic of ireland': 'EU',
  // Italy
  'it':                 'EU',
  'italy':              'EU',
  // Latvia
  'lv':                 'EU',
  'latvia':             'EU',
  // Lithuania
  'lt':                 'EU',
  'lithuania':          'EU',
  // Luxembourg
  'lu':                 'EU',
  'luxembourg':         'EU',
  // Malta
  'mt':                 'EU',
  'malta':              'EU',
  // Netherlands
  'nl':                 'EU',
  'netherlands':        'EU',
  'the netherlands':    'EU',
  'holland':            'EU',
  // Poland
  'pl':                 'EU',
  'poland':             'EU',
  // Portugal
  'pt':                 'EU',
  'portugal':           'EU',
  // Romania
  'ro':                 'EU',
  'romania':            'EU',
  // Slovakia
  'sk':                 'EU',
  'slovakia':           'EU',
  // Slovenia
  'si':                 'EU',
  'slovenia':           'EU',
  // Spain
  'es':                 'EU',
  'spain':              'EU',
  // Sweden
  'se':                 'EU',
  'sweden':             'EU',

  // ── EEA/EFTA non-EU European states (mapped to EU per rationale) ─
  // Norway
  'no':              'EU',
  'norway':          'EU',
  // Switzerland
  'ch':              'EU',
  'switzerland':     'EU',
  // Iceland
  'is':              'EU',
  'iceland':         'EU',
  // Liechtenstein
  'li':              'EU',
  'liechtenstein':   'EU'
};

/**
 * normalizeCountry(input)
 * Accepts a country name, ISO-2 code, or free text (case-insensitive, leading/
 * trailing whitespace ignored) and returns one of 'US','GB','EU','CA','AU' or null.
 *
 * @param {string} input
 * @returns {'US'|'GB'|'EU'|'CA'|'AU'|null}
 */
function normalizeCountry(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    return null;
  }
  const key = input.trim().toLowerCase();
  return ALIAS_MAP[key] || null;
}

/**
 * getResourcesForCountry(input)
 * Returns an object with official resources, legalAid resources, and the
 * global UNHCR links for the matched country.
 *
 * For an unknown or empty input, returns:
 *   { country: 'GLOBAL', name: '', official: [], legalAid: [], global: data.global }
 *
 * @param {string} input
 * @returns {{ country: string, name: string, official: Array, legalAid: Array, global: Array }}
 */
function getResourcesForCountry(input) {
  const code = normalizeCountry(input);

  if (!code || !data.countries[code]) {
    return {
      country: 'GLOBAL',
      name: '',
      official: [],
      legalAid: [],
      global: data.global
    };
  }

  const countryData = data.countries[code];
  return {
    country: code,
    name: countryData.name,
    official: countryData.official,
    legalAid: countryData.legalAid,
    global: data.global
  };
}

module.exports = { getResourcesForCountry, normalizeCountry, data };

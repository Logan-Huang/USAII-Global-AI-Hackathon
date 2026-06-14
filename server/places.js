'use strict';

// Nearby-help lookup for the map: geocoding (Nominatim) + POI search (Overpass).
// Both are free OpenStreetMap services (no API key). We call them server-side so
// we can send a proper User-Agent, cache results, and respect usage policies.
//
// IMPORTANT (quality): a generic "lawyer" pin is the wrong door for an asylum
// seeker. We foreground refugee/migrant-relevant places — NGOs, charities,
// social facilities, community centres — and clearly mark the data as unverified
// community mapping. The curated directory ("Find legal help") remains primary.

const UA =
  'AsylumAid/0.1 (USAII Global AI Hackathon project; contact: set-your-email@example.com)';
// Open-Meteo geocoding is free, key-less, permissive, and datacenter/CORS
// friendly (Nominatim blocks many server IPs). Used for place name -> coords.
const GEOCODER = 'https://geocoding-api.open-meteo.com/v1/search';
// Overpass mirrors, tried in order (the main instance can be busy / rate-limit).
// NOTE: every mirror here must carry GLOBAL OSM data. Regional instances (e.g.
// overpass.osm.ch = Switzerland only) must NOT be added: because we race mirrors
// with Promise.any, a regional instance returns a fast empty 200 that wins the
// race and yields "0 results" everywhere outside its region.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

function makeCache(ttlMs) {
  const m = new Map();
  return {
    get(k) {
      const e = m.get(k);
      if (!e) return null;
      if (Date.now() > e.exp) {
        m.delete(k);
        return null;
      }
      return e.val;
    },
    set(k, v) {
      m.set(k, { val: v, exp: Date.now() + ttlMs });
    },
  };
}
const geoCache = makeCache(24 * 60 * 60 * 1000); // 24h
const placesCache = makeCache(60 * 60 * 1000); // 1h

async function fetchWithTimeout(url, opts = {}, ms = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Geocode a place name / city into coordinates.
async function geocode(query) {
  const q = String(query || '').trim().slice(0, 200);
  if (!q) return null;
  const key = q.toLowerCase();
  const cached = geoCache.get(key);
  if (cached !== null) return cached || null; // `false` = cached miss

  // Open-Meteo matches on a place name; use the part before any comma as the
  // search term but keep the full text for display.
  const name = q.split(',')[0].trim() || q;
  const url =
    GEOCODER + '?count=1&format=json&language=en&name=' + encodeURIComponent(name);
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('geocode_http_' + res.status);
  const data = await res.json();
  const r = data && data.results && data.results[0];
  if (!r) {
    geoCache.set(key, false); // cache the miss
    return null;
  }
  const out = {
    lat: r.latitude,
    lon: r.longitude,
    displayName: [r.name, r.admin1, r.country].filter(Boolean).join(', ') || q,
  };
  geoCache.set(key, out);
  return out;
}

function categoryOf(tags) {
  if (!tags) return 'Service';
  if (tags.office === 'ngo') return 'NGO';
  if (tags.office === 'charity') return 'Charity';
  if (tags.amenity === 'social_facility' || tags.social_facility) return 'Social facility';
  if (tags.amenity === 'community_centre') return 'Community centre';
  if (tags.office === 'lawyer' || tags.amenity === 'lawyer') return 'Lawyer';
  if (tags.office === 'government') return 'Government office';
  return 'Service';
}

// Lower number = shown first. Refugee/migrant-relevant services rank above
// generic lawyers (who are usually the wrong door for an asylum seeker).
const PRIORITY = {
  NGO: 0,
  Charity: 1,
  'Social facility': 2,
  'Community centre': 3,
  'Government office': 4,
  Lawyer: 5,
  Service: 6,
};

// Find nearby help around a point. Uses nwr + "out center" so facilities mapped
// as ways/relations (most of them) return a usable coordinate.
async function places(lat, lon, radius) {
  const la = Number(lat);
  const lo = Number(lon);
  if (!isFinite(la) || !isFinite(lo)) throw new Error('bad_coords');
  let r = Number(radius) || 6000;
  if (r < 500) r = 500;
  if (r > 25000) r = 25000;

  const key = la.toFixed(3) + ',' + lo.toFixed(3) + ',' + r;
  const cached = placesCache.get(key);
  if (cached) return cached;

  const ql =
    '[out:json][timeout:25];(' +
    `nwr["office"~"ngo|charity|lawyer"](around:${r},${la},${lo});` +
    `nwr["amenity"~"social_facility|community_centre"](around:${r},${la},${lo});` +
    ');out center tags 80;';

  // Race all mirrors; the first one to return wins. Overpass instances vary a
  // lot in load/latency, so racing is far more reliable than trying in series.
  const attempts = OVERPASS_ENDPOINTS.map(async (endpoint) => {
    const res = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'data=' + encodeURIComponent(ql),
      },
      18000
    );
    if (!res.ok) throw new Error('overpass_http_' + res.status);
    return res.json();
  });

  let data;
  try {
    data = await Promise.any(attempts);
  } catch (e) {
    throw new Error('overpass_unavailable');
  }

  const seen = new Set();
  const out = [];
  for (const el of data.elements || []) {
    const tags = el.tags || {};
    const name = tags.name;
    if (!name) continue; // unnamed POIs are not useful to a person
    const plat = el.lat != null ? el.lat : el.center && el.center.lat;
    const plon = el.lon != null ? el.lon : el.center && el.center.lon;
    if (plat == null || plon == null) continue;

    const id = name + '@' + plat.toFixed(4) + ',' + plon.toFixed(4);
    if (seen.has(id)) continue;
    seen.add(id);

    let website = tags.website || tags['contact:website'] || '';
    if (website && !/^https?:\/\//i.test(website)) website = '';

    out.push({
      name: String(name).slice(0, 120),
      lat: plat,
      lon: plon,
      category: categoryOf(tags),
      phone: (tags.phone || tags['contact:phone'] || '').slice(0, 40),
      website: website.slice(0, 300),
      address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
        .filter(Boolean)
        .join(' ')
        .slice(0, 160),
    });
  }

  out.sort(
    (a, b) =>
      (PRIORITY[a.category] - PRIORITY[b.category]) || a.name.localeCompare(b.name)
  );
  const limited = out.slice(0, 60);
  placesCache.set(key, limited);
  return limited;
}

module.exports = { geocode, places };

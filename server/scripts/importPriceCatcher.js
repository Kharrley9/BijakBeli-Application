/**
 * importPriceCatcher.js
 * ─────────────────────────────────────────────────────────────────────────
 * Replaces BijakBeli's generated stores and prices with REAL ones from the
 * official KPDN PriceCatcher open data on data.gov.my:
 *
 *   https://data.gov.my/data-catalogue/pricecatcher
 *   Licence: CC BY 4.0. The app must credit "PriceCatcher, KPDN (data.gov.my)".
 *
 *  1. Downloads lookup_premise.csv and the last --months monthly price files.
 *  2. Keeps premises belonging to the app's 10 supermarket chains (CHAINS).
 *  3. Finds each premise's coordinates with OpenStreetMap Nominatim (the store
 *     itself, else its postcode, else its district). Results are cached in
 *     scripts/data/premise-geocode.json so each address is looked up once.
 *  4. For every premise x fresh item: latest observed price, plus the previous
 *     different price as previousPrice. Implausible outliers are dropped.
 *  5. Writes to MongoDB (after a backup to server/backups/):
 *       - deletes the generated stores (no premiseCode) with their prices and
 *         promotions, which only ever pointed at those stores;
 *       - upserts one Store per premise (keyed by premiseCode);
 *       - upserts prices, and removes prices a store no longer reports;
 *       - hides active items nobody in our chains prices (noPriceData: true)
 *         and re-shows previously hidden ones once prices appear;
 *       - upserts daily price summaries (PriceDaily) for the trend chart. Days
 *         from earlier runs are kept, so history grows with each import.
 *
 * Usage (from the repo root or server/):
 *   node server/scripts/importPriceCatcher.js --dry-run     report only, no DB writes
 *   node server/scripts/importPriceCatcher.js               backup + apply
 *   options: --months=2  how many monthly files to read (default 2)
 *
 * Re-run it any time to refresh prices; geocoding is cached so later runs are fast.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const readline = require('readline');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Store = require('../models/Store');
const Price = require('../models/Price');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const User = require('../models/User');
const PriceDaily = require('../models/PriceDaily');

// ── CLI ──────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
const MONTHS = Math.max(
  1,
  parseInt((process.argv.find((a) => a.startsWith('--months=')) || '').split('=')[1], 10) || 2
);

// ── Sources ──────────────────────────────────────────────────────────────
const BASE = 'https://storage.data.gov.my/pricecatcher';
const DOWNLOAD_DIR = path.join(os.tmpdir(), 'bijakbeli-pricecatcher');
const GEO_CACHE_FILE = path.join(__dirname, 'data', 'premise-geocode.json');
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'BijakBeli/1.0 (student project; one-time geocoding of PriceCatcher premises)';

// A store's latest price older than this (vs. the newest date in the data) is ignored.
const STALE_DAYS = 45;
// A price more than this factor away from the item's median across stores is a typo.
const OUTLIER_FACTOR = 4;
// A store found by name must lie this close to its postcode/district point.
const MAX_PREMISE_DRIFT_KM = 20;

/**
 * The app's chains. `match` picks premises by name; `strip` removes the chain
 * part so what's left is the branch ("GIANT HYPERMARKET TAMPOI" -> "Tampoi").
 * Plain AEON (supermarkets in AEON malls) is deliberately left out: only AEON BiG
 * is in the app's store list.
 */
const CHAINS = [
  { name: 'AEON BiG', match: /^AEON\s*BIG\b/i, strip: /^AEON\s*BIG\b/i },
  {
    name: "Lotus's",
    match: /^(LOTUS|TESCO)/i,
    strip: /^(LOTUS\S*|TESCO)(\s+(EXTRA|STORES?|HYPERMARKET|SUPERMARKET))*/i,
  },
  {
    name: 'MYDIN',
    match: /\bMYDIN\b/i,
    strip: /^.*?\bMYDIN\b(\s+(MART|WHOLESALE|HYPERMARKET|EMPORIUM|MALL|SUPERMARKET|HYPERMART))*/i,
  },
  {
    name: 'Giant',
    match: /^GIANT\b/i,
    strip: /^GIANT(\s+(HYPERMARKET|SUPERMARKET|SUPERSTORE|MART|EXPRESS))*/i,
  },
  {
    name: 'Econsave',
    match: /\bECONSAVE\b/i,
    strip: /^.*?\bECONSAVE\b(\s+(CASH\s*(&|AND)?\s*CARRY|SUPERMARKET|HYPERMARKET))*/i,
  },
  {
    name: 'NSK Trade City',
    match: /\bNSK\b/i,
    strip: /^.*?\bNSK\b(\s+(TRADE\s+CITY|GROCER|HYPERMARKET|SUPERMARKET))*/i,
  },
  {
    name: 'TF Value-Mart',
    match: /^TF\b|\bVALUE[- ]?MART\b/i,
    strip: /^.*?(\bTF\s+)?\bVALUE[- ]?MART\b|^TF\b/i,
  },
  {
    name: 'Servay',
    match: /\bSERVAY\b/i,
    strip: /^.*?\bSERVAY\b(\s+(HYPERMARKET|SUPERMARKET|MART))*/i,
  },
  {
    name: 'Billion',
    match: /\bBILLION\b/i,
    strip: /^.*?\bBILLION\b(\s+(SHOPPING\s+CENT(RE|ER)|SUPERMARKET|HYPERMARKET|SUPERSTORE))*/i,
  },
  { name: 'The Store', match: /^THE\s+STORE\b/i, strip: /^THE\s+STORE\b(\s+SUPERMARKET)*/i },
];

const STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis',
  'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu',
  'W.P. Kuala Lumpur', 'W.P. Labuan', 'W.P. Putrajaya',
];

// ── Small helpers ──────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function csvRow(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') { quoted = !quoted; continue; }
    if (ch === ',' && !quoted) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// Place abbreviations that should stay in capitals after title-casing.
const KEEP_CAPS = new Set(['USJ', 'MITC', 'KLCC', 'TTDI', 'PJ', 'KL', 'JB', 'KB', 'WP', 'SS', 'AU', 'TTC', 'UTC', 'KK']);

function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/(^|[\s(/-])([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase())
    // keep codes like SS2 / PJS 1 with digits, and known abbreviations, in caps
    .replace(/\b([a-z]*\d[a-z\d]*)\b/gi, (w) => w.toUpperCase())
    .replace(/\b[A-Za-z]+\b/g, (w) => (KEEP_CAPS.has(w.toUpperCase()) ? w.toUpperCase() : w));
}

/**
 * Postcode ranges per state, used to reject street numbers or typos that look
 * like a postcode ("NO 24211, JALAN ..." in a KL address).
 */
const POSTCODE_RANGES = {
  Perlis: [[1000, 2999]],
  Kedah: [[5000, 9999]],
  'Pulau Pinang': [[10000, 14999]],
  Kelantan: [[15000, 18999]],
  Terengganu: [[20000, 24999]],
  Pahang: [[25000, 28999], [39000, 39999], [49000, 49999], [69000, 69999]],
  Perak: [[30000, 36999]],
  Selangor: [[40000, 48999], [63000, 68199]],
  'W.P. Kuala Lumpur': [[50000, 60999], [68000, 68199]],
  'W.P. Putrajaya': [[62000, 62999]],
  'W.P. Labuan': [[87000, 87999]],
  'Negeri Sembilan': [[70000, 73999]],
  Melaka: [[75000, 78999]],
  Johor: [[79000, 86999]],
  Sabah: [[88000, 91999]],
  Sarawak: [[93000, 98999]],
};

function postcodeFitsState(postcode, state) {
  const ranges = POSTCODE_RANGES[state];
  if (!ranges) return true; // unknown state: don't second-guess
  const n = parseInt(postcode, 10);
  return ranges.some(([lo, hi]) => n >= lo && n <= hi);
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** "W.P. Kuala Lumpur" -> "Kuala Lumpur", for search queries. */
const stateForQuery = (state) => state.replace(/^W\.?P\.?\s*/i, '');

function monthKeys(n) {
  const keys = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    keys.push(`${y}-${m}`);
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
  }
  return keys.reverse(); // oldest first
}

// ── Downloads ────────────────────────────────────────────────────────────
/** Downloads `name` into DOWNLOAD_DIR unless a copy younger than `maxAgeH` exists. */
async function download(name, { maxAgeH = 12, optional = false } = {}) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  const dest = path.join(DOWNLOAD_DIR, name);
  if (fs.existsSync(dest) && Date.now() - fs.statSync(dest).mtimeMs < maxAgeH * 3600e3) {
    return dest;
  }
  const res = await fetch(`${BASE}/${name}`, { signal: AbortSignal.timeout(10 * 60e3) });
  if (!res.ok) {
    if (optional && (res.status === 404 || res.status === 403)) return null;
    throw new Error(`Download ${name} failed: HTTP ${res.status}`);
  }
  const tmp = `${dest}.part`;
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmp));
  fs.renameSync(tmp, dest);
  return dest;
}

// ── Premises ───────────────────────────────────────────────────────────────
function chainOf(premiseName) {
  return CHAINS.find((c) => c.match.test(premiseName)) || null;
}

const STATE_WORDS = new RegExp(
  `\\b(${[
    ...STATES.map(stateForQuery),
    'Penang', 'Malacca', 'Darul Aman', 'Darul Takzim', 'Darul Ehsan', 'Darul Ridzuan',
    'Darul Makmur', 'Darul Naim', 'Darul Khusus', 'Darul Iman', 'Darul Ta\'zim',
  ]
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
    .join('|')})\\b`,
  'gi'
);
const STREET_START = /^(JALAN|JLN|LORONG|LRG|LOT|NO|TAMAN|TMN|PERSIARAN|LEBUH|BATU|KM)\b/i;

/** The postcode in an address that is valid for the premise's state, or null. */
function postcodeFrom(address, state) {
  const hits = (address.match(/\b\d{5}\b/g) || []).filter((pc) => postcodeFitsState(pc, state));
  return hits.length ? hits[hits.length - 1] : null;
}

/** Town from an address like "..., 47301 PETALING JAYA, SELANGOR" (null if none). */
function townFrom(address, state) {
  const postcode = postcodeFrom(address, state);
  if (!postcode) return null;
  const m = address.match(new RegExp(`\\b${postcode}\\b\\s*,?\\s*([A-Za-z][A-Za-z .'\`-]*)`));
  if (!m) return null;
  // "81750 MASAI JOHOR" -> "MASAI"; "11700 PULAU PINANG" -> nothing (state, not town)
  const raw = m[1].replace(/[.\s]+$/, '').trim();
  let town = raw.replace(STATE_WORDS, '').replace(/\s{2,}/g, ' ').trim();
  // Kuala Lumpur, Putrajaya, Labuan and Melaka are both a state and a town.
  if (!town && /^(KUALA LUMPUR|PUTRAJAYA|LABUAN|MELAKA)\b/i.test(raw)) town = raw.match(/^(KUALA LUMPUR|PUTRAJAYA|LABUAN|MELAKA)/i)[1];
  if (town.length < 3 || STREET_START.test(town)) return null;
  return titleCase(town);
}

function branchFrom(premiseName, chain, town) {
  let b = premiseName
    .replace(/`/g, "'")
    .replace(chain.strip, '')
    .replace(/\(\s*[A-Z]{1,3}\s*\)/g, ' ') // company codes like (M), (BH), (S)
    .replace(/\b(SDN\.?\s*BHD|S\/B|PASARAYA|SUPERMARKET|HYPERMARKET|DEPARTMENTAL\s+STORE)\b\.?/gi, ' ')
    .replace(/[()]/g, ' ')
    .replace(/\s+\.(\s|$)/g, ' ')
    .replace(/^[\s,.\-–:]+|[\s,.\-–:]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (b.length < 2) b = town || '';
  return b ? titleCase(b) : '';
}

function loadPremises(file) {
  const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
  const premises = new Map(); // code -> premise
  for (const line of rows) {
    const [code, name, address, type, state, district] = csvRow(line);
    const pc = parseInt(code, 10);
    if (!pc || pc < 0 || !name) continue;
    const chain = chainOf(name);
    if (!chain) continue;
    const town = townFrom(address || '', state || '');
    premises.set(pc, {
      code: pc,
      rawName: name,
      chain,
      branch: branchFrom(name, chain, town),
      address: (address || '').replace(/\s*,\s*/g, ', ').replace(/,\s*$/, ''),
      type: /hyper/i.test(type || '') ? 'hypermarket' : 'supermarket',
      state: state || '',
      district: district || '',
      town,
      postcode: postcodeFrom(address || '', state || ''),
    });
  }
  return premises;
}

// ── Geocoding (Nominatim, cached) ────────────────────────────────────────────
let geoCache = {};
let lastRequestAt = 0;
let networkLookups = 0;

function loadGeoCache() {
  try {
    geoCache = JSON.parse(fs.readFileSync(GEO_CACHE_FILE, 'utf8'));
  } catch {
    geoCache = {};
  }
}
function saveGeoCache() {
  fs.mkdirSync(path.dirname(GEO_CACHE_FILE), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(geoCache).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(GEO_CACHE_FILE, `${JSON.stringify(sorted, null, 1)}\n`);
}

/**
 * One Nominatim search, cached by its parameters. Returns an array of
 * { lat, lng, state, name, kind } (possibly empty). Respects the 1 req/s policy.
 */
async function nominatim(params) {
  const key = JSON.stringify(params);
  if (geoCache[key]) return geoCache[key];

  const qs = new URLSearchParams({
    format: 'jsonv2',
    countrycodes: 'my',
    addressdetails: '1',
    limit: '5',
    ...params,
  });

  for (let attempt = 1; attempt <= 3; attempt++) {
    const wait = 1100 - (Date.now() - lastRequestAt);
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    networkLookups++;
    try {
      const res = await fetch(`${NOMINATIM}?${qs}`, {
        headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) return [];
      const rows = await res.json();
      const out = rows.map((r) => ({
        lat: Number(r.lat),
        lng: Number(r.lon),
        state: r.address?.state || '',
        name: r.name || '',
        kind: `${r.category}/${r.type}`,
      }));
      geoCache[key] = out;
      if (networkLookups % 20 === 0) saveGeoCache();
      return out;
    } catch (err) {
      if (attempt === 3) {
        console.warn(`\n   ⚠️  Nominatim failed for ${key}: ${err.message}`);
        return []; // not cached, so a re-run retries it
      }
      await sleep(5000 * attempt);
    }
  }
  return [];
}

/** Coordinates for a premise: { lat, lng, precision } or null. */
async function geocodePremise(p) {
  const state = stateForQuery(p.state);

  // Anchor: the postcode area, else the district. Used to sanity-check name hits.
  let anchor = null;
  if (p.postcode) {
    const [hit] = await nominatim({ postalcode: p.postcode, country: 'Malaysia' });
    if (hit) anchor = { ...hit, precision: 'postcode' };
  }
  if (!anchor && p.town) {
    const [hit] = await nominatim({ q: `${p.town}, ${state}, Malaysia` });
    if (hit) anchor = { ...hit, precision: 'postcode' }; // a town is about as precise as a postcode
  }
  if (!anchor && p.district) {
    const [hit] = await nominatim({ q: `${p.district}, ${state}, Malaysia` });
    if (hit) anchor = { ...hit, precision: 'district' };
  }

  const near = (h) =>
    anchor
      ? haversineKm(h, anchor) <= MAX_PREMISE_DRIFT_KM
      : h.state && h.state.toLowerCase().includes(state.toLowerCase());

  // The store itself: first by its registered name, then by the everyday name
  // OSM mappers tend to use ("Lotus's Cheras", "AEON BiG Mid Valley").
  const name = p.rawName.replace(/`/g, "'");
  const queries = [`${name}, ${p.town || p.district}, ${state}`];
  if (p.branch) queries.push(`${p.chain.name} ${p.branch}, ${state}`);
  for (const q of queries) {
    // eslint-disable-next-line no-await-in-loop
    const good = (await nominatim({ q })).find(near);
    if (good) return { lat: good.lat, lng: good.lng, precision: 'premise' };
  }
  if (anchor) return { lat: anchor.lat, lng: anchor.lng, precision: anchor.precision };
  return null;
}

// ── Prices ───────────────────────────────────────────────────────────────
/**
 * Streams the monthly CSVs and returns Map<"premise|item", [[date, price], ...]>
 * for our premises and items only.
 */
async function readObservations(files, premises, itemCodes) {
  const obs = new Map();
  let rows = 0;
  let kept = 0;
  let newest = '';
  for (const file of files) {
    const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
    let header = true;
    for await (const line of rl) {
      if (header) { header = false; continue; }
      if (!line) continue;
      rows++;
      const [date, pcRaw, icRaw, priceRaw] = line.split(',');
      const pc = parseInt(pcRaw, 10);
      const ic = parseInt(icRaw, 10);
      if (!premises.has(pc) || !itemCodes.has(ic)) continue;
      const price = parseFloat(priceRaw);
      if (!(price > 0)) continue;
      const key = `${pc}|${ic}`;
      if (!obs.has(key)) obs.set(key, []);
      obs.get(key).push([date, price]);
      kept++;
      if (date > newest) newest = date;
    }
  }
  return { obs, rows, kept, newest };
}

/** Latest price per premise x item, with previousPrice and outliers removed. */
function latestPrices(obs, newest) {
  const cutoff = new Date(newest);
  cutoff.setDate(cutoff.getDate() - STALE_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const latest = [];
  for (const [key, list] of obs) {
    list.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    const [date, price] = list[list.length - 1];
    if (date < cutoffStr) continue;
    let previousPrice = null;
    for (let i = list.length - 2; i >= 0; i--) {
      if (list[i][1] !== price) { previousPrice = list[i][1]; break; }
    }
    const [pc, ic] = key.split('|').map(Number);
    latest.push({ pc, ic, date, price, previousPrice });
  }

  // Drop typos: a price far from the item's median across all our stores.
  const byItem = new Map();
  for (const r of latest) {
    if (!byItem.has(r.ic)) byItem.set(r.ic, []);
    byItem.get(r.ic).push(r.price);
  }
  const medians = new Map([...byItem].map(([ic, ps]) => [ic, median(ps)]));
  const clean = [];
  const outliers = [];
  for (const r of latest) {
    const m = medians.get(r.ic);
    if (r.price > m * OUTLIER_FACTOR || r.price < m / OUTLIER_FACTOR) outliers.push({ ...r, median: m });
    else {
      if (r.previousPrice != null) {
        const pm = r.previousPrice;
        if (pm > m * OUTLIER_FACTOR || pm < m / OUTLIER_FACTOR) r.previousPrice = null;
      }
      clean.push(r);
    }
  }
  return { clean, outliers, cutoffStr };
}

/**
 * Daily summaries per item (and per state) for the trend chart: median/min/max
 * of that day's observations, with the same outlier rule as latestPrices.
 * Days with fewer than MIN_DAILY_OBS observations are too thin to plot.
 */
const MIN_DAILY_OBS = 3;

function stat(prices) {
  return {
    median: Math.round(median(prices) * 100) / 100,
    min: Math.min(...prices),
    max: Math.max(...prices),
    count: prices.length,
  };
}

function dailySummaries(obs, premises) {
  // item -> all observed prices, for the outlier median
  const allByItem = new Map();
  for (const [key, list] of obs) {
    const ic = Number(key.split('|')[1]);
    if (!allByItem.has(ic)) allByItem.set(ic, []);
    for (const [, price] of list) allByItem.get(ic).push(price);
  }
  const itemMedian = new Map([...allByItem].map(([ic, ps]) => [ic, median(ps)]));

  // item -> date -> { all: [], byState: Map(state -> []) }
  const days = new Map();
  for (const [key, list] of obs) {
    const [pc, ic] = key.split('|').map(Number);
    const state = premises.get(pc)?.state || '';
    const m = itemMedian.get(ic);
    for (const [date, price] of list) {
      if (price > m * OUTLIER_FACTOR || price < m / OUTLIER_FACTOR) continue;
      if (!days.has(ic)) days.set(ic, new Map());
      const byDate = days.get(ic);
      if (!byDate.has(date)) byDate.set(date, { all: [], byState: new Map() });
      const d = byDate.get(date);
      d.all.push(price);
      if (!d.byState.has(state)) d.byState.set(state, []);
      d.byState.get(state).push(price);
    }
  }

  const out = [];
  for (const [ic, byDate] of days) {
    for (const [date, d] of byDate) {
      if (d.all.length < MIN_DAILY_OBS) continue;
      out.push({
        ic,
        date,
        ...stat(d.all),
        byState: [...d.byState]
          .filter(([state, ps]) => state && ps.length >= MIN_DAILY_OBS)
          .map(([state, ps]) => ({ state, ...stat(ps) })),
      });
    }
  }
  return out;
}

// ── DB ───────────────────────────────────────────────────────────────────
async function backup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(__dirname, '..', 'backups', `before-pricecatcher-${stamp}`);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, Model] of Object.entries({ stores: Store, prices: Price, promotions: Promotion, products: Product })) {
    const docs = await Model.find().lean();
    fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(docs));
    console.log(`   💾 ${name}: ${docs.length}`);
  }
  return dir;
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`PriceCatcher import${DRY_RUN ? ' (DRY RUN, no DB writes)' : ''}\n`);

  await mongoose.connect(process.env.MONGO_URI);

  // Items we can price: visible ones, plus ones an earlier run hid for lack of data.
  const products = await Product.find({
    itemCode: { $ne: null },
    $or: [{ status: 'active' }, { noPriceData: true }],
  }).lean();
  const productByCode = new Map(products.map((p) => [p.itemCode, p]));
  console.log(`🛒 Candidate items: ${products.length}`);

  // 1. Downloads
  console.log('⬇️  Downloading PriceCatcher files…');
  const premiseFile = await download('lookup_premise.csv');
  const months = monthKeys(MONTHS);
  const priceFiles = [];
  for (const m of months) {
    const f = await download(`pricecatcher_${m}.csv`, { optional: true });
    console.log(`   ${m}: ${f ? 'ok' : 'not published (skipped)'}`);
    if (f) priceFiles.push(f);
  }
  if (!priceFiles.length) throw new Error('No monthly price files found');

  // 2. Premises in our chains
  const premises = loadPremises(premiseFile);
  console.log(`🏬 Chain premises in lookup: ${premises.size}`);

  // 3. Prices
  const { obs, rows, kept, newest } = await readObservations(priceFiles, premises, new Set(productByCode.keys()));
  const { clean, outliers, cutoffStr } = latestPrices(obs, newest);
  console.log(`💰 Read ${rows.toLocaleString()} rows, kept ${kept.toLocaleString()} for our chains/items`);
  console.log(`   newest date ${newest}, ignoring prices last seen before ${cutoffStr}`);
  console.log(`   ${clean.length.toLocaleString()} store×item prices, ${outliers.length} outliers dropped`);
  outliers.slice(0, 8).forEach((o) =>
    console.log(`     ✂️  premise ${o.pc} item ${o.ic}: RM${o.price} (median RM${o.median.toFixed(2)})`)
  );

  const pricedPremises = new Set(clean.map((r) => r.pc));

  // 4. Geocode premises that actually have prices
  loadGeoCache();
  const toGeocode = [...pricedPremises].map((pc) => premises.get(pc));
  console.log(`📍 Geocoding ${toGeocode.length} premises (cached in scripts/data/premise-geocode.json)…`);
  const coords = new Map();
  let i = 0;
  for (const p of toGeocode) {
    // eslint-disable-next-line no-await-in-loop
    const c = await geocodePremise(p);
    if (c) coords.set(p.code, c);
    i++;
    process.stdout.write(`\r   ${i}/${toGeocode.length}  (network lookups: ${networkLookups})`);
  }
  saveGeoCache();
  console.log('');
  const precision = { premise: 0, postcode: 0, district: 0 };
  for (const c of coords.values()) precision[c.precision]++;
  const ungeocoded = toGeocode.filter((p) => !coords.has(p.code));
  console.log(`   found ${coords.size}: ${precision.premise} by store name, ${precision.postcode} by postcode, ${precision.district} by district`);
  if (ungeocoded.length) {
    console.log(`   ⚠️  ${ungeocoded.length} without coordinates (skipped):`);
    ungeocoded.forEach((p) => console.log(`      ${p.code} ${p.rawName} | ${p.address}`));
  }

  // Final store list: premises with prices AND coordinates
  const finalPremises = toGeocode.filter((p) => coords.has(p.code));
  const finalPrices = clean.filter((r) => coords.has(r.pc));
  const perChain = {};
  for (const p of finalPremises) perChain[p.chain.name] = (perChain[p.chain.name] || 0) + 1;
  console.log('\n🏪 Stores per chain:', perChain);
  console.log('   sample names:');
  for (const c of CHAINS) {
    const ex = finalPremises.filter((p) => p.chain === c).slice(0, 3);
    if (ex.length) console.log(`     ${c.name}: ${ex.map((p) => `"${p.rawName}" → ${p.branch}${p.town ? ` (${p.town})` : ''}`).join(' · ')}`);
  }

  const finalItems = new Set(finalPrices.map((r) => r.ic));
  const unpriced = products.filter((p) => !finalItems.has(p.itemCode));
  console.log(`\n🥬 Items with real prices: ${finalItems.size} of ${products.length}`);
  console.log(`   ${unpriced.length} without any price in our chains, will be hidden:`);
  unpriced.slice(0, 60).forEach((p) => console.log(`     🙈 ${p.productName}`));

  const daily = dailySummaries(obs, premises).filter((d) => finalItems.has(d.ic));
  const dayCount = new Set(daily.map((d) => d.date)).size;
  console.log(`\n📈 Daily trend points: ${daily.length} (${dayCount} days × ${finalItems.size} items)`);

  const generatedStores = await Store.find({ premiseCode: null }).select('_id storeName').lean();
  console.log(`\n🗑️  Generated stores to remove: ${generatedStores.length} (with their prices and promotions)`);

  if (DRY_RUN) {
    console.log('\nDry run finished. Nothing was written to the database.');
    await mongoose.disconnect();
    return;
  }

  // 5. Write
  console.log('\n💾 Backing up…');
  const dir = await backup();
  console.log(`   → ${path.relative(path.join(__dirname, '..', '..'), dir)}`);

  const genIds = generatedStores.map((s) => s._id);
  const delPrices = await Price.deleteMany({ storeId: { $in: genIds } });
  const delPromos = await Promotion.deleteMany({ storeId: { $in: genIds } });
  await User.updateMany({}, { $pull: { preferredStores: { $in: genIds } } });
  const delStores = await Store.deleteMany({ _id: { $in: genIds } });
  console.log(`   removed ${delStores.deletedCount} stores, ${delPrices.deletedCount} prices, ${delPromos.deletedCount} promotions`);

  // Stores
  const storeOps = finalPremises.map((p) => {
    const c = coords.get(p.code);
    return {
      updateOne: {
        filter: { premiseCode: p.code },
        update: {
          $set: {
            storeName: p.chain.name,
            branch: p.branch || p.town || titleCase(p.district),
            mallName: `${p.chain.name} ${p.branch || p.town || titleCase(p.district)}`.trim(),
            type: p.type,
            state: p.state,
            city: p.town || titleCase(p.district) || p.state,
            address: p.address || `${p.district}, ${p.state}`,
            location: { type: 'Point', coordinates: [c.lng, c.lat] },
            geoPrecision: c.precision,
            status: 'active',
            isActive: true,
          },
        },
        upsert: true,
      },
    };
  });
  await Store.bulkWrite(storeOps, { ordered: false });
  const importedCodes = finalPremises.map((p) => p.code);
  const deactivated = await Store.updateMany(
    { premiseCode: { $ne: null, $nin: importedCodes } },
    { $set: { isActive: false, status: 'suspended' } }
  );
  const storeDocs = await Store.find({ premiseCode: { $in: importedCodes } }).select('_id premiseCode').lean();
  const storeIdByCode = new Map(storeDocs.map((s) => [s.premiseCode, s._id]));
  console.log(`   upserted ${storeOps.length} stores${deactivated.modifiedCount ? `, deactivated ${deactivated.modifiedCount} no longer reporting` : ''}`);

  // Prices
  const keepByStore = new Map();
  const priceOps = finalPrices.map((r) => {
    const storeId = storeIdByCode.get(r.pc);
    const productId = productByCode.get(r.ic)._id;
    if (!keepByStore.has(String(storeId))) keepByStore.set(String(storeId), []);
    keepByStore.get(String(storeId)).push(productId);
    return {
      updateOne: {
        filter: { productId, storeId },
        update: {
          $set: {
            price: r.price,
            previousPrice: r.previousPrice,
            inStock: true,
            lastUpdated: new Date(`${r.date}T12:00:00+08:00`),
          },
        },
        upsert: true,
      },
    };
  });
  for (let k = 0; k < priceOps.length; k += 2000) {
    // eslint-disable-next-line no-await-in-loop
    await Price.bulkWrite(priceOps.slice(k, k + 2000), { ordered: false });
    process.stdout.write(`\r   prices ${Math.min(k + 2000, priceOps.length)}/${priceOps.length}`);
  }
  console.log('');
  let stale = 0;
  for (const [storeId, productIds] of keepByStore) {
    // eslint-disable-next-line no-await-in-loop
    const r = await Price.deleteMany({ storeId, productId: { $nin: productIds } });
    stale += r.deletedCount;
  }
  if (stale) console.log(`   removed ${stale} prices stores no longer report`);

  // Daily trend summaries (upsert: older days from earlier runs are kept as history)
  const dailyOps = daily.map((d) => ({
    updateOne: {
      filter: { productId: productByCode.get(d.ic)._id, date: d.date },
      update: {
        $set: { median: d.median, min: d.min, max: d.max, count: d.count, byState: d.byState },
      },
      upsert: true,
    },
  }));
  for (let k = 0; k < dailyOps.length; k += 2000) {
    // eslint-disable-next-line no-await-in-loop
    await PriceDaily.bulkWrite(dailyOps.slice(k, k + 2000), { ordered: false });
  }
  console.log(`   trend points upserted: ${dailyOps.length}`);

  // Products: hide unpriced, re-show priced
  const pricedIds = [...finalItems].map((ic) => productByCode.get(ic)._id);
  const hidden = await Product.updateMany(
    { status: 'active', itemCode: { $ne: null }, _id: { $nin: pricedIds } },
    { $set: { status: 'inactive', noPriceData: true } }
  );
  const reshown = await Product.updateMany(
    { noPriceData: true, _id: { $in: pricedIds } },
    { $set: { status: 'active', noPriceData: false } }
  );
  console.log(`   items hidden: ${hidden.modifiedCount}, re-shown: ${reshown.modifiedCount}`);

  console.log(`\n🎉 Done. ${storeOps.length} real stores, ${priceOps.length} real prices (data up to ${newest}).`);
  console.log('   Source: PriceCatcher, KPDN (data.gov.my), CC BY 4.0. Geocoding © OpenStreetMap contributors.');
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch(async (err) => {
    console.error('\n❌ Import failed:', err.message);
    try { saveGeoCache(); } catch { /* ignore */ }
    try { await mongoose.disconnect(); } catch { /* ignore */ }
    process.exit(1);
  });
}

module.exports = { loadPremises, townFrom, branchFrom, titleCase, latestPrices };

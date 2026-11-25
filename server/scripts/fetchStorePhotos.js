/**
 * fetchStorePhotos.js
 * ─────────────────────────────────────────────────────────────────────────
 * Gives each store a photo from Wikimedia Commons (free licences only; never
 * from the retailers' own sites) and stores the credit the licence requires.
 *
 *  1. A photo of the branch itself, when Commons has one:
 *       - a file whose title names the chain and the branch
 *         ("Econsave Pontian.jpg" for Econsave Pontian), or
 *       - a file geotagged within GEO_RADIUS_M of the store whose title names
 *         the chain (only for stores whose own location is known precisely).
 *     Titles about interiors, car parks, food, logos etc. are skipped.
 *  2. Otherwise a hand-picked photo of another store of the same chain
 *     (CHAIN_PHOTOS, each checked by eye), which the app labels as such.
 *
 * Writes Store.bannerImage + Store.photoCredit. Price imports don't touch these
 * fields; run this again after an import adds new stores.
 *
 * Usage (from server/):
 *   node scripts/fetchStorePhotos.js --dry-run    report only
 *   node scripts/fetchStorePhotos.js              write to MongoDB
 */
'use strict';

const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Store = require('../models/Store');

const DRY_RUN = process.argv.includes('--dry-run');
const API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'BijakBeli/1.0 (PSM student project; grocery price comparison app)';
const CACHE_FILE = path.join(__dirname, 'data', 'commons-cache.json');
const GEO_RADIUS_M = 250;
const THUMB_WIDTH = 900;

/** Hand-picked stand-in photos per chain (all viewed; free licences). */
const CHAIN_PHOTOS = {
  'AEON BiG': 'File:Facade of Aeon Big Batu Pahat in Taman Flora Utama, Johor 20250212 144513.jpg',
  "Lotus's": "File:Lotus's Mutiara Damansara.jpg",
  MYDIN: 'File:Mydin Mall Ayer Keroh.jpg',
  Giant: 'File:Giant Hypermarket Kota Damansara.jpg',
  Econsave: 'File:Econsave Senai.jpg',
  'NSK Trade City': 'File:NSK Trade City Pandan.jpg',
  'TF Value-Mart': 'File:TF Value-Mart Taman Connaught (231105).jpg',
  Billion: 'File:Billion Port Dickson (220709).jpg',
  'The Store': 'File:The Store Batu Pahat.jpg',
  // Not the opening-ceremony photo (a crowd of faces): Eastern Plaza with its
  // "Servay Jaya" sign is the only Commons view of a Servay store front.
  Servay: 'File:Eastern Plaza Tawau.jpg',
  'Target Supermarket': 'File:Target Supermarket of Yong Peng.jpg',
};

/** How each chain is written in Commons file titles (normalised, see norm()). */
const CHAIN_ALIASES = {
  'AEON BiG': ['aeon big'],
  "Lotus's": ['lotus s', 'lotuss', 'tesco'],
  MYDIN: ['mydin'],
  Giant: ['giant hypermarket', 'giant supermarket', 'giant mall', 'giant'],
  Econsave: ['econsave'],
  'NSK Trade City': ['nsk'],
  'TF Value-Mart': ['tf value mart', 'value mart'],
  Servay: ['servay'],
  Billion: ['billion'],
  'The Store': ['the store'],
  'Target Supermarket': ['target supermarket', 'pasaraya target'],
};

// Not a picture of the store front.
const SKIP_TITLE =
  /interior|inside|cashier|counter|car ?park|parking|menu|burger|chicken|food|qr code|mysejahtera|notice|information|logo|bus stop|post office|petrol|panic|decoration|cny|opening|ceremony|toilet|disabled|aisle|shelf|price|receipt|trolley|staff|geograph/i;
// The photo is of the store itself: the title starts with the chain's name
// ("Econsave Pontian.jpg") or says it shows the front ("Facade of Aeon Big ...").
// Rejects e.g. "Setia Avenue to Lotus's" or "Klang Jaya LRT Station ... and Lotus's".
const FRONT_VIEW = /facade|front|exterior|building/i;
// A title match geotagged farther than this from the store is another place.
const MAX_FILE_DRIFT_KM = 5;
// Branch words too common to identify a branch on their own.
const GENERIC_WORDS = new Set([
  'mall', 'bazaar', 'jalan', 'jln', 'taman', 'tmn', 'bandar', 'the', 'and', 'city', 'trade',
  'hypermarket', 'supermarket', 'express', 'extra', 'station', 'store', 'stores', 'mart', 'value',
  'tesco', 'lotus', 'lotuss', 'aeon', 'big', 'mydin', 'giant', 'econsave', 'nsk', 'servay', 'billion',
]);

const norm = (s) =>
  ` ${s
    .toLowerCase()
    .replace(/^file:/, '')
    .replace(/\.(jpe?g|png|tiff?|svg|webp)$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
const hasPhrase = (title, phrase) => norm(title).includes(` ${phrase} `);
const isPhotoFile = (title) => /\.(jpe?g)$/i.test(title) && !SKIP_TITLE.test(title);
const mentionsChain = (title, chain) => (CHAIN_ALIASES[chain] || []).some((a) => hasPhrase(title, a));
const startsWithChain = (title, chain) =>
  (CHAIN_ALIASES[chain] || []).some((a) => norm(title).startsWith(` ${a} `));
/** A photo of the chain's store front, judged from its title. */
const storeFrontTitle = (title, chain) =>
  isPhotoFile(title) && mentionsChain(title, chain) && (startsWithChain(title, chain) || FRONT_VIEW.test(title));

function haversineKm(a, b) {
  const r = (d) => (d * Math.PI) / 180;
  const h =
    Math.sin(r(b.lat - a.lat) / 2) ** 2 +
    Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// ── Commons API (throttled, cached) ─────────────────────────────────────────
let cache = {};
try {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
} catch {
  cache = {};
}
const saveCache = () => {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, `${JSON.stringify(cache, null, 1)}\n`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
let networkCalls = 0;

async function commons(params) {
  const key = JSON.stringify(params);
  if (cache[key]) return cache[key];
  for (let attempt = 1; attempt <= 4; attempt++) {
    const wait = 1500 - (Date.now() - lastCall);
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    networkCalls++;
    const qs = new URLSearchParams({ format: 'json', maxlag: '5', ...params });
    try {
      const res = await fetch(`${API}?${qs}`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(20000),
      });
      const text = await res.text();
      if (!res.ok || !text.startsWith('{')) throw new Error(`HTTP ${res.status}: ${text.slice(0, 60)}`);
      const json = JSON.parse(text);
      if (json.error) throw new Error(json.error.info || json.error.code);
      cache[key] = json;
      if (networkCalls % 20 === 0) saveCache();
      return json;
    } catch (err) {
      if (attempt === 4) {
        console.warn(`\n   ⚠️  Commons failed (${err.message}) for ${key}`);
        return null;
      }
      await sleep(10000 * attempt); // rate limited: back off
    }
  }
  return null;
}

/** All Commons file titles that mention a chain (one search per alias). */
async function chainTitles(chain) {
  const titles = new Set();
  for (const alias of CHAIN_ALIASES[chain] || []) {
    const j = await commons({
      action: 'query',
      list: 'search',
      srnamespace: '6',
      srlimit: '500',
      srsearch: `intitle:"${alias}"`,
    });
    for (const r of j?.query?.search || []) {
      if (storeFrontTitle(r.title, chain)) titles.add(r.title);
    }
  }
  return [...titles];
}

/** Files geotagged near a point, nearest first. */
async function filesNear(lat, lng) {
  const j = await commons({
    action: 'query',
    list: 'geosearch',
    gscoord: `${lat.toFixed(5)}|${lng.toFixed(5)}`,
    gsradius: String(GEO_RADIUS_M),
    gsnamespace: '6',
    gslimit: '50',
  });
  return j?.query?.geosearch || [];
}

/** Geotag of each title that has one: Map<title, {lat, lng}>. */
async function fileCoords(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const j = await commons({ action: 'query', prop: 'coordinates', titles: titles.slice(i, i + 50).join('|') });
    for (const p of Object.values(j?.query?.pages || {})) {
      const c = p.coordinates?.[0];
      if (c) out.set(p.title, { lat: c.lat, lng: c.lon });
    }
  }
  return out;
}

/** Image URL + credit for up to 50 titles at a time. */
async function imageInfo(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const j = await commons({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: String(THUMB_WIDTH),
      titles: batch.join('|'),
    });
    for (const p of Object.values(j?.query?.pages || {})) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata || {};
      const text = (v) => (v || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const license = text(m.LicenseShortName?.value);
      // Commons only hosts free files, but be strict about what we show
      if (!/^(cc|public domain|pd)/i.test(license)) continue;
      out.set(p.title, {
        url: ii.thumburl || ii.url,
        author: text(m.Artist?.value).slice(0, 120) || 'Wikimedia Commons contributor',
        license,
        sourceUrl: ii.descriptionurl,
      });
    }
  }
  return out;
}

// ── Matching ────────────────────────────────────────────────────────────────
function branchWords(store) {
  return norm(store.branch || store.city || '')
    .trim()
    .split(' ')
    // numbers count whatever their length ("Seksyen 13", "Station 18")
    .filter((w) => (w.length >= 3 || /^\d+$/.test(w)) && !GENERIC_WORDS.has(w));
}

/** A title naming this chain and every distinctive word of the branch. */
function titleForBranch(store, titles) {
  const words = branchWords(store);
  // A number alone ("18" of "Station 18") matches photos from anywhere
  if (!words.some((w) => /[a-z]/.test(w))) return null;
  const hits = titles.filter((t) => words.every((w) => norm(t).includes(` ${w} `)));
  if (!hits.length) return null;
  // Prefer a front view, then the shortest (least specific) title
  hits.sort((a, b) => /facade|front|exterior/i.test(b) - /facade|front|exterior/i.test(a) || a.length - b.length);
  return hits[0];
}

async function main() {
  console.log(`Store photos from Wikimedia Commons${DRY_RUN ? ' (DRY RUN)' : ''}\n`);
  await mongoose.connect(process.env.MONGO_URI);

  const stores = await Store.find({ isActive: { $ne: false } }).lean();
  console.log(`🏬 ${stores.length} active stores`);

  const chains = [...new Set(stores.map((s) => s.storeName))];
  const titlesByChain = {};
  for (const c of chains) {
    titlesByChain[c] = await chainTitles(c);
    console.log(`   ${c}: ${titlesByChain[c].length} Commons photos mention it`);
  }

  // 1. branch photos
  const pick = new Map(); // storeId -> { title, scope }
  let byTitle = 0;
  let byGeo = 0;
  let done = 0;
  for (const s of stores) {
    done++;
    process.stdout.write(`\r   matching ${done}/${stores.length}`);
    const t = titleForBranch(s, titlesByChain[s.storeName] || []);
    if (t) {
      pick.set(String(s._id), { title: t, scope: 'branch' });
      byTitle++;
      continue;
    }
    const [lng, lat] = s.location?.coordinates || [];
    if (s.geoPrecision !== 'premise' || typeof lat !== 'number') continue;
    const near = (await filesNear(lat, lng)).find((g) => storeFrontTitle(g.title, s.storeName));
    if (near) {
      pick.set(String(s._id), { title: near.title, scope: 'branch' });
      byGeo++;
    }
  }
  console.log(`\n📸 Branch photos: ${byTitle} by title, ${byGeo} by location`);

  // A photo geotagged far from the store shows another place with the same
  // name (or another country): drop it.
  const picked = [...pick.entries()];
  const coords = await fileCoords([...new Set(picked.map(([, p]) => p.title))]);
  let dropped = 0;
  for (const [id, p] of picked) {
    const s = stores.find((x) => String(x._id) === id);
    const c = coords.get(p.title);
    const [lng, lat] = s.location?.coordinates || [];
    if (c && typeof lat === 'number' && haversineKm(c, { lat, lng }) > MAX_FILE_DRIFT_KM) {
      pick.delete(id);
      dropped++;
    }
  }
  if (dropped) console.log(`   dropped ${dropped} geotagged > ${MAX_FILE_DRIFT_KM} km from the store`);

  // 2. chain stand-ins
  let standIn = 0;
  for (const s of stores) {
    if (pick.has(String(s._id))) continue;
    const t = CHAIN_PHOTOS[s.storeName];
    if (t) {
      // The stand-in may well be this very branch
      pick.set(String(s._id), { title: t, scope: 'chain' });
      standIn++;
    }
  }
  const none = stores.length - pick.size;
  console.log(`   Chain stand-ins: ${standIn}, no photo: ${none}`);

  const info = await imageInfo([...new Set([...pick.values()].map((p) => p.title))]);
  saveCache();

  const samples = stores
    .filter((s) => pick.get(String(s._id))?.scope === 'branch')
    .map((s) => `     ${s.storeName} ${s.branch} ← ${pick.get(String(s._id)).title}`);
  if (samples.length) console.log(`   sample branch matches:\n${samples.join('\n')}`);

  if (DRY_RUN) {
    console.log(`\nDry run finished (${networkCalls} Commons requests). Nothing written.`);
    await mongoose.disconnect();
    return;
  }

  const ops = [];
  for (const s of stores) {
    const p = pick.get(String(s._id));
    const i = p && info.get(p.title);
    ops.push({
      updateOne: {
        filter: { _id: s._id },
        update: i
          ? {
              $set: {
                bannerImage: i.url,
                photoCredit: { author: i.author, license: i.license, sourceUrl: i.sourceUrl, scope: p.scope },
              },
            }
          : { $set: { bannerImage: '' }, $unset: { photoCredit: '' } },
      },
    });
  }
  const r = await Store.bulkWrite(ops, { ordered: false });
  console.log(`\n🎉 Updated ${r.modifiedCount} stores (${networkCalls} Commons requests).`);
  console.log('   Photos: Wikimedia Commons contributors (credited per store in the app).');
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

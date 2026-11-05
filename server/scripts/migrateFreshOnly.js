/**
 * migrateFreshOnly.js
 * ─────────────────────────────────────────────────────────────────────────
 * Turns BijakBeli into a fresh-produce-only app (Price Catcher "BARANGAN SEGAR"):
 *
 *  1. Backs up products, prices, categories and promotions to server/backups/<timestamp>/.
 *  2. Replaces the old categories with the 9 fresh categories (Malay name + English nameEn
 *     + a free-stock photo).
 *  3. Moves every fresh product into its category (by itemCategory) and hides the ones a
 *     supermarket-only, halal-conscious app shouldn't list (see HIDDEN).
 *  4. DELETES every non-fresh product and everything that points at it
 *     (prices, promotions, crowdsourced prices, favourites, list items, analytics).
 *  5. Generates realistic per-store prices for the fresh products, plus a few promotions.
 *
 * Usage:
 *   node server/scripts/migrateFreshOnly.js --dry-run   (report only, no writes)
 *   node server/scripts/migrateFreshOnly.js             (backup + apply)
 */
'use strict';

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Price = require('../models/Price');
const Promotion = require('../models/Promotion');
const Store = require('../models/Store');
const User = require('../models/User');
const CrowdsourcedPrice = require('../models/CrowdsourcedPrice');
const FavoriteProduct = require('../models/FavoriteProduct');
const ShoppingListItem = require('../models/ShoppingListItem');
const Analytics = require('../models/Analytics');

const DRY_RUN = process.argv.includes('--dry-run');
const FRESH_GROUP = 'BARANGAN SEGAR';

// ── Photos (free-licensed stock, each checked by eye) ───────────────────────
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&q=80&auto=format`;
const pexels = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`;

// itemCategory (Price Catcher) → our category. Order = order in the app.
const CATEGORIES = [
  { key: 'AYAM',          ms: 'Ayam',          en: 'Chicken',         icon: 'egg-outline',        image: pexels(7140306) },  // raw drumsticks
  { key: 'DAGING',        ms: 'Daging',        en: 'Meat',            icon: 'restaurant-outline', image: pexels(8477071) },  // raw beef steaks
  { key: 'BAHAN LAUT',    ms: 'Bahan Laut',    en: 'Seafood',         icon: 'fish-outline',       image: pexels(2031994) },  // prawns & crustaceans on ice
  { key: 'IKAN DARAT',    ms: 'Ikan Darat',    en: 'Freshwater Fish', icon: 'water-outline',      image: pexels(8352786) },  // tilapia
  { key: 'SAYUR-SAYURAN', ms: 'Sayur-sayuran', en: 'Vegetables',      icon: 'leaf-outline',       image: unsplash('1624668430039-0175a0fbf006') },
  { key: 'KELAPA',        ms: 'Kelapa',        en: 'Coconut',         icon: 'ellipse-outline',    image: pexels(4294738) },  // split coconut
  { key: 'MEE/KUETIAU',   ms: 'Mee/Kuetiau',   en: 'Noodles',         icon: 'reorder-four-outline', image: pexels(5907896) }, // fresh egg-noodle nests
  { key: 'BUAH-BUAHAN',   ms: 'Buah-buahan',   en: 'Fruits',          icon: 'nutrition-outline',  image: unsplash('1574661062600-4a3cd81d2375') },
  { key: 'TELUR',         ms: 'Telur',         en: 'Eggs',            icon: 'egg-outline',        image: pexels(8556246) },
];

// Fresh items kept in the DB but hidden (status 'inactive'). Flip back to show them.
//  - Tauhu & tempe: not one of the 9 categories (owner's choice).
//  - Pork: the chains include halal-only stores (e.g. MYDIN), so pork isn't listed.
//  - Live animals: sold at wet markets, not by these supermarket chains.
const HIDDEN = [
  { test: (p) => p.itemCategory === 'TAUHU DAN TEMPE', why: 'not in the 9 categories' },
  { test: (p) => /\bBABI\b/.test(p.productName), why: 'pork' },
  // (not "KUNYIT HIDUP" — that's fresh turmeric)
  { test: (p) => /^(AYAM( TUA)?|BABI) HIDUP/.test(p.productName), why: 'live animal' },
];

// ── Typical Malaysian retail prices (RM per item unit), late 2026 ────────────
// First matching rule wins, so specific patterns come before general ones.
const BASE_PRICES = [
  // Ayam (per kg)
  [/AYAM BELANDA/, 14.9], [/AYAM BERSIH - SUPER/, 10.6], [/AYAM BERSIH - STANDARD/, 9.6],
  [/DADA AYAM/, 12.5], [/KEPAK AYAM/, 13.9], [/PAHA AYAM/, 11.5], [/THIGH AYAM/, 11.9], [/WHOLE LEG AYAM/, 10.9],
  // Daging (per kg)
  [/PAHA KAMBING.*LAMB/, 48], [/PAHA KAMBING/, 44], [/BEBIRI.*TANPA TULANG.*LAMB/, 55], [/BEBIRI.*TANPA TULANG/, 50],
  [/BEBIRI.*BERTULANG.*LAMB/, 45], [/BEBIRI.*BERTULANG/, 40], [/KAMBING TEMPATAN/, 58],
  [/KERBAU IMPORT.*BLOCK/, 22.5], [/KERBAU IMPORT/, 27.5], [/KERBAU TEMPATAN/, 38],
  [/LEMBU IMPORT \(BLOCK\)/, 30], [/LEMBU IMPORT \(BLADE\)/, 38], [/LEMBU IMPORT/, 41],
  [/LEMBU TEMPATAN.*BAHAGIAN 1/, 39], [/LEMBU TEMPATAN/, 36],
  // Bahan laut (per kg)
  [/UDANG HARIMAU/, 65], [/UDANG PUTIH BESAR \(ANTARA 20/, 55], [/UDANG PUTIH BESAR/, 38], [/UDANG PUTIH KECIL/, 26],
  [/VANNAMEI/, 30], [/KETAM/, 36], [/SOTONG/, 26], [/KERANG/, 11],
  [/KEPALA IKAN JENAHAK/, 18], [/KEPALA IKAN MERAH/, 16],
  [/JENAHAK \(KEPINGAN/, 56], [/JENAHAK/, 42], [/MERAH \(KEPINGAN/, 48], [/IKAN MERAH/, 38],
  [/TENGGIRI BATANG \(KEPINGAN/, 48], [/TENGGIRI BATANG/, 38], [/TENGGIRI PAPAN/, 35],
  [/PARANG \(KEPINGAN/, 32], [/PARANG/, 25], [/PARI/, 18],
  [/BAWAL PUTIH/, 46], [/BAWAL HITAM/, 22], [/KERAPU/, 50], [/SENANGIN/, 30], [/SIAKAP/, 24], [/TERUBOK/, 30],
  [/DEMUDUK/, 22], [/GELAMA/, 14], [/KERISI/, 14], [/MABUNG/, 12], [/CENCARU/, 10],
  [/KEMBUNG KECIL/, 12.5], [/KEMBUNG/, 16], [/SELAR KUNING/, 12], [/SELAR/, 14],
  [/SELAYANG.*≥ 13/, 9], [/SELAYANG/, 10.5], [/TAMBAN/, 8], [/TONGKOL.*PUTIH/, 14], [/TONGKOL/, 13],
  // Ikan darat (per kg)
  [/HARUAN/, 22], [/KELI/, 9.5], [/TILAPIA MERAH/, 13.5], [/TILAPIA HITAM/, 10.5],
  // Kelapa
  [/KELAPA BIJI/, 3.2], [/KELAPA PARUT/, 9], [/SANTAN.*PEKAT/, 14], [/SANTAN/, 10],
  // Mee / kuetiau (per ~450 g pack)
  [/KUETIAU/, 2.3], [/MEE KUNING/, 2.5],
  // Buah-buahan
  [/ANGGUR HIJAU/, 18], [/ANGGUR MERAH/, 16], [/BETIK/, 5], [/DRAGON FRUIT/, 9], [/EPAL HIJAU/, 1.6], [/EPAL MERAH/, 1.5],
  [/JAMBU BATU TANPA BIJI/, 8], [/JAMBU BATU/, 6], [/LAI KUNING/, 2.2], [/LIMAU KASTURI/, 9], [/LIMAU NIPIS/, 8],
  [/NENAS/, 4.5], [/OREN/, 1.3], [/PISANG BERANGAN/, 6], [/PISANG EMAS/, 7],
  [/TEMBIKAI MERAH TANPA BIJI/, 3.5], [/TEMBIKAI MERAH/, 2.8], [/TEMBIKAI SUSU/, 5],
  // Sayur-sayuran (per kg)
  [/PERAI.*IMPORT/, 10], [/PERAI/, 8], [/BAYAM MERAH/, 5.5], [/BAYAM/, 5], [/BROKOLI/, 12],
  [/CILI AKAR MERAH/, 16], [/CILI AKAR HIJAU/, 14], [/CILI API.*MERAH/, 20], [/CILI API/, 18],
  [/CILI MERAH - KULAI/, 14], [/CILI MERAH - MINYAK/, 12], [/CILI HIJAU/, 10],
  [/HALIA/, 10], [/BENDI/, 7], [/KACANG BOTOL/, 9], [/BUNCIS/, 8], [/KACANG PANJANG/, 7], [/KAILAN/, 7], [/KANGKUNG/, 4.5],
  [/KUBIS BULAT \(TEMPATAN/, 4], [/KUBIS BULAT IMPORT \(BEIJING/, 5], [/KUBIS BULAT IMPORT/, 4.3],
  [/KUBIS BUNGA/, 9], [/KUBIS PANJANG CHINA/, 5], [/KUBIS PANJANG/, 6], [/KUNYIT/, 9],
  [/BENGGALA HIJAU/, 12], [/BENGGALA/, 16], [/LENGKUAS/, 7], [/LOBAK MERAH/, 4], [/LOBAK PUTIH/, 4],
  [/SADERI/, 12], [/SAWI PENDEK/, 7], [/SAWI/, 5], [/TAUGE/, 4], [/TERUNG/, 7], [/TIMUN/, 3.5], [/TOMATO/, 5],
  // Telur
  [/GRED A.*BERAT/, 4.6], [/GRED A/, 13.5], [/GRED B.*BERAT/, 4.4], [/GRED B/, 12.8], [/GRED C.*BERAT/, 4.1], [/GRED C/, 12],
  [/TELUR AYAM KAMPUNG/, 8], [/TELUR ITIK/, 6.5], [/TELUR PUYUH/, 4], [/TELUR MASIN/, null], // masin: priced by unit below
];

/** Per-chain price level vs the market average (cheaper discounters < 1). */
const CHAIN_FACTOR = {
  'MYDIN': 0.95, 'Econsave': 0.96, 'NSK Trade City': 0.96, 'TF Value-Mart': 0.97, 'Giant': 0.98,
  "Lotus's": 1.0, 'AEON BiG': 1.01, 'Billion': 1.02, 'The Store': 1.02, 'Servay': 1.03,
};

function basePrice(p) {
  if (/TELUR MASIN/.test(p.productName)) return /4 Biji/i.test(p.unit) ? 3.6 : 0.95;
  for (const [re, price] of BASE_PRICES) if (re.test(p.productName)) return price;
  return null;
}

// Deterministic pseudo-random in [0,1) from a string, so re-runs give the same prices.
function rand(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
const round05 = (n) => Math.max(0.05, Math.round(n * 20) / 20);

// Price Catcher's CSV has ≥ / ≤ mangled to "b\t%" / "b\t$" — repair them.
const fixName = (s) => s.replace(/b\t%/g, '≥').replace(/b\t\$/g, '≤');

async function backup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(__dirname, '..', 'backups', `before-fresh-only-${stamp}`);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, Model] of [['products', Product], ['prices', Price], ['categories', Category], ['promotions', Promotion]]) {
    const docs = await Model.find().lean();
    fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(docs));
    console.log(`  💾 ${name}: ${docs.length}`);
  }
  return dir;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(DRY_RUN ? '🔎 DRY RUN — nothing will be written\n' : '🚀 Applying migration\n');

  const fresh = await Product.find({ itemGroup: FRESH_GROUP }).lean();
  const nonFresh = await Product.find({ itemGroup: { $ne: FRESH_GROUP } }, '_id').lean();
  const nonFreshIds = nonFresh.map((p) => p._id);
  const stores = await Store.find({ isActive: { $ne: false } }).lean();

  // This script generates FAKE prices. Once real PriceCatcher stores are imported
  // (scripts/importPriceCatcher.js) it would overwrite them, so refuse.
  if (!DRY_RUN && stores.some((s) => s.premiseCode != null) && !process.argv.includes('--force')) {
    console.error(
      '❌ Real PriceCatcher stores are in the database; this script would replace their real\n' +
        '   prices with generated ones. Refresh prices with `npm run import:prices` instead.\n' +
        '   (Pass --force only if you really want generated data back.)'
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const hiddenWhy = (p) => HIDDEN.find((h) => h.test(p))?.why;
  const visible = fresh.filter((p) => !hiddenWhy(p));
  const unpriced = visible.filter((p) => basePrice(p) == null);

  console.log(`Fresh products: ${fresh.length} (${visible.length} shown, ${fresh.length - visible.length} hidden)`);
  fresh.filter(hiddenWhy).forEach((p) => console.log(`  🙈 ${p.productName} — ${hiddenWhy(p)}`));
  console.log(`Non-fresh products to DELETE: ${nonFreshIds.length}`);
  console.log(`  with prices: ${await Price.countDocuments({ productId: { $in: nonFreshIds } })}, promotions: ${await Promotion.countDocuments({ productId: { $in: nonFreshIds } })}`);
  console.log(`Stores: ${stores.length}`);
  if (unpriced.length) {
    console.log('❌ No base price rule for:');
    unpriced.forEach((p) => console.log(`   ${p.productName}`));
    throw new Error('Add BASE_PRICES rules for the items above');
  }

  if (DRY_RUN) {
    await mongoose.disconnect();
    return;
  }

  console.log('\n1. Backup');
  const dir = await backup();
  console.log(`  → ${dir}`);

  console.log('\n2. Categories');
  const catIdByKey = {};
  for (const [order, c] of CATEGORIES.entries()) {
    const doc = await Category.findOneAndUpdate(
      { categoryName: c.ms },
      { $set: { categoryName: c.ms, nameEn: c.en, icon: c.icon, image: c.image, order, emoji: '🛒' } },
      { upsert: true, new: true }
    );
    catIdByKey[c.key] = doc._id;
    console.log(`  ✅ ${c.ms} / ${c.en}`);
  }
  // Tauhu & tempe have no category of their own; park them (hidden) under Sayur-sayuran.
  catIdByKey['TAUHU DAN TEMPE'] = catIdByKey['SAYUR-SAYURAN'];
  const keepCatIds = Object.values(catIdByKey);

  console.log('\n3. Fresh products → categories');
  const imageByKey = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.image]));
  for (const p of fresh) {
    const set = {
      categoryId: catIdByKey[p.itemCategory],
      productName: fixName(p.productName),
      status: hiddenWhy(p) ? 'inactive' : 'active',
    };
    if (!p.image) set.image = imageByKey[p.itemCategory] || imageByKey['SAYUR-SAYURAN'];
    await Product.updateOne({ _id: p._id }, { $set: set });
  }
  console.log(`  ✅ ${fresh.length} updated`);

  console.log('\n4. Delete non-fresh products and their references');
  const del = async (label, Model, filter) => {
    const { deletedCount } = await Model.deleteMany(filter);
    console.log(`  🗑️  ${label}: ${deletedCount}`);
  };
  await del('prices', Price, { productId: { $in: nonFreshIds } });
  await del('promotions', Promotion, { productId: { $in: nonFreshIds } });
  await del('crowdsourced prices', CrowdsourcedPrice, { productId: { $in: nonFreshIds } });
  await del('favourites', FavoriteProduct, { productId: { $in: nonFreshIds } });
  await del('shopping-list items', ShoppingListItem, { productId: { $in: nonFreshIds } });
  await del('analytics', Analytics, { productId: { $in: nonFreshIds } });
  await User.updateMany({}, { $pull: { preferredProducts: { $in: nonFreshIds } } });
  await del('products', Product, { _id: { $in: nonFreshIds } });
  await del('old categories', Category, { _id: { $nin: keepCatIds } });

  console.log('\n5. Generate prices');
  // Start clean for fresh items so re-runs don't stack up.
  await Price.deleteMany({ productId: { $in: fresh.map((p) => p._id) } });
  const now = Date.now();
  const rows = [];
  for (const p of visible) {
    const base = basePrice(p);
    for (const s of stores) {
      const seed = `${p._id}:${s._id}`;
      if (rand(`carry:${seed}`) < 0.12) continue; // ~12% of store/item pairs not stocked
      const factor = CHAIN_FACTOR[s.storeName] ?? 1;
      const noise = 0.94 + rand(`noise:${seed}`) * 0.12; // ±6%
      const price = round05(base * factor * noise);
      const moved = rand(`prev:${seed}`);
      rows.push({
        productId: p._id,
        storeId: s._id,
        price,
        // ~30% of rows changed recently, so price trends have something to show
        previousPrice: moved < 0.15 ? round05(price * 1.06) : moved < 0.3 ? round05(price * 0.95) : null,
        inStock: rand(`stock:${seed}`) > 0.04,
        lastUpdated: new Date(now - Math.floor(rand(`age:${seed}`) * 6 * 86400000)),
      });
    }
  }
  await Price.insertMany(rows, { ordered: false });
  console.log(`  ✅ ${rows.length} prices for ${visible.length} products × ${stores.length} stores`);

  console.log('\n6. Promotions');
  await Promotion.deleteMany({ productId: { $in: fresh.map((p) => p._id) } });
  const promoRows = rows
    .filter((r) => r.inStock)
    .sort((a, b) => rand(`promo:${a.productId}:${a.storeId}`) - rand(`promo:${b.productId}:${b.storeId}`))
    .filter((r, i, arr) => arr.findIndex((x) => String(x.productId) === String(r.productId)) === i) // one per product
    .slice(0, 12);
  const nameById = Object.fromEntries(visible.map((p) => [String(p._id), fixName(p.productName)]));
  const promos = promoRows.map((r, i) => {
    const pct = [10, 12, 15, 18, 20, 25][i % 6];
    const short = nameById[String(r.productId)].split(' (')[0];
    return {
      productId: r.productId,
      storeId: r.storeId,
      promotionTitle: `${short} — ${pct}% off`,
      promotionType: i % 4 === 0 ? 'seasonal' : 'discount',
      promotionPrice: round05(r.price * (1 - pct / 100)),
      discountPercentage: pct,
      startDate: new Date(now - 86400000),
      endDate: new Date(now + 14 * 86400000),
    };
  });
  await Promotion.insertMany(promos);
  console.log(`  ✅ ${promos.length} promotions (valid 14 days)`);

  console.log('\n🎉 Done.');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('\n' + err.message);
  await mongoose.disconnect();
  process.exit(1);
});

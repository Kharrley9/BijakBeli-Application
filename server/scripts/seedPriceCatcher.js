/**
 * seedPriceCatcher.js
 * ─────────────────────────────────────────────────────────────────────────
 * Downloads the official Price Catcher item lookup from data.gov.my and
 * seeds all ~800+ items into BijakBeli's Products + Categories collections.
 *
 * Usage:
 *   node server/scripts/seedPriceCatcher.js
 *   node server/scripts/seedPriceCatcher.js --dry-run   (no DB writes)
 *   node server/scripts/seedPriceCatcher.js --reset      (drop existing official items first)
 */

'use strict';

const path   = require('path');
const https  = require('https');
const fs     = require('fs');

// ── Load env ───────────────────────────────────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Product  = require('../models/Product');
const Category = require('../models/Category');

// ── CLI flags ──────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
const RESET   = process.argv.includes('--reset');

// ── Price Catcher open-data URL ────────────────────────────────────────────
const CSV_URL = 'https://storage.data.gov.my/pricecatcher/lookup_item.csv';

// ── item_group → Category icon mapping ────────────────────────────────────
const GROUP_ICON = {
  'BARANGAN SEGAR':         'leaf-outline',
  'BARANGAN KERING':        'basket-outline',
  'BARANGAN BERBUNGKUS':    'cube-outline',
  'MINUMAN':                'water-outline',
  'MAKANAN SIAP MASAK':     'restaurant-outline',
  'SUSU DAN BARANGAN BAYI': 'heart-outline',
  'PRODUK KEBERSIHAN':      'sparkles-outline',
  'BARANGAN KEDAI SERBANEKA': 'storefront-outline',
};

// ── item_group sort order ──────────────────────────────────────────────────
const GROUP_ORDER = [
  'BARANGAN SEGAR',
  'BARANGAN KERING',
  'BARANGAN BERBUNGKUS',
  'MINUMAN',
  'MAKANAN SIAP MASAK',
  'SUSU DAN BARANGAN BAYI',
  'PRODUK KEBERSIHAN',
  'BARANGAN KEDAI SERBANEKA',
];

// ── Helpers ────────────────────────────────────────────────────────────────
function downloadCSV(url) {
  return new Promise((resolve, reject) => {
    let data = '';
    https.get(url, (res) => {
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSV(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const header = lines[0].split(',');
  return lines.slice(1).map(line => {
    // Handle quoted fields (e.g. "TEPUNG, CAP SAUH")
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { cols.push(current); current = ''; continue; }
      current += ch;
    }
    cols.push(current);
    return Object.fromEntries(header.map((h, i) => [h.trim(), (cols[i] || '').trim()]));
  }).filter(r => r.item_code && r.item_code !== '-1' && r.item);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔄  Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected.\n');

  // 1. Download CSV
  console.log('⬇️   Downloading Price Catcher item list from data.gov.my…');
  const raw  = await downloadCSV(CSV_URL);
  const rows = parseCSV(raw);
  console.log(`📦  Parsed ${rows.length} items.\n`);

  if (DRY_RUN) {
    console.log('🔍  DRY RUN — showing first 10 rows:');
    console.table(rows.slice(0, 10));
    await mongoose.disconnect();
    return;
  }

  // 2. Optionally wipe existing official items
  if (RESET) {
    console.log('🗑️   --reset: removing existing official items…');
    const { deletedCount } = await Product.deleteMany({ isOfficialItem: true });
    console.log(`   Removed ${deletedCount} products.\n`);
  }

  // 3. Upsert Categories (one per unique item_group)
  const uniqueGroups = [...new Set(rows.map(r => r.item_group).filter(Boolean))];
  console.log(`📂  Upserting ${uniqueGroups.length} categories…`);

  const categoryMap = {}; // group name → ObjectId
  for (const group of uniqueGroups) {
    const cat = await Category.findOneAndUpdate(
      { categoryName: group },
      {
        categoryName: group,
        icon:  GROUP_ICON[group] || 'pricetag-outline',
        order: GROUP_ORDER.indexOf(group) >= 0 ? GROUP_ORDER.indexOf(group) : 99,
      },
      { upsert: true, new: true }
    );
    categoryMap[group] = cat._id;
  }
  console.log('   Categories ready.\n');

  // 4. Upsert Products
  console.log(`🛒  Upserting ${rows.length} products…`);
  let created = 0, updated = 0, skipped = 0;

  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await Promise.all(batch.map(async (r) => {
      const code     = parseInt(r.item_code, 10);
      const catId    = categoryMap[r.item_group];
      if (!catId) { skipped++; return; }

      const doc = {
        productName:    r.item,
        unit:           r.unit || 'unit',
        itemCode:       code,
        itemGroup:      r.item_group,
        itemCategory:   r.item_category,
        isOfficialItem: true,
        categoryId:     catId,
        status:         'active',
      };

      const existing = await Product.findOne({ itemCode: code });
      if (existing) {
        await Product.updateOne({ _id: existing._id }, { $set: doc });
        updated++;
      } else {
        await Product.create(doc);
        created++;
      }
    }));

    const done = Math.min(i + BATCH, rows.length);
    process.stdout.write(`\r   Progress: ${done}/${rows.length}`);
  }

  console.log(`\n\n🎉  Seed complete!`);
  console.log(`   Created : ${created}`);
  console.log(`   Updated : ${updated}`);
  console.log(`   Skipped : ${skipped}`);

  await mongoose.disconnect();
  console.log('\n🔌  Disconnected.');
}

main().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});

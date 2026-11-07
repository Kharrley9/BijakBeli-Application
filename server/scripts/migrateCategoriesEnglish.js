/**
 * migrateCategoriesEnglish.js
 * ─────────────────────────────────────────────────────────────────────────
 * Renames all 8 Price Catcher categories from Malay → English and
 * reassigns all products' categoryIds accordingly.
 *
 * Usage: node server/scripts/migrateCategoriesEnglish.js
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product  = require('../models/Product');

// Malay → English mapping (8 main categories as user requested)
const RENAME = {
  'BARANGAN SEGAR':           { en: 'Fresh Produce',        icon: 'leaf-outline',          emoji: '🥬', order: 0 },
  'BARANGAN KERING':          { en: 'Dry Goods',            icon: 'basket-outline',        emoji: '🌾', order: 1 },
  'BARANGAN BERBUNGKUS':      { en: 'Packaged Goods',       icon: 'cube-outline',          emoji: '📦', order: 2 },
  'MINUMAN':                  { en: 'Beverages',            icon: 'water-outline',         emoji: '🥤', order: 3 },
  'MAKANAN SIAP MASAK':       { en: 'Ready-to-Cook Food',  icon: 'restaurant-outline',    emoji: '🍽️', order: 4 },
  'SUSU DAN BARANGAN BAYI':   { en: 'Milk & Baby Products',icon: 'heart-outline',         emoji: '🍼', order: 5 },
  'PRODUK KEBERSIHAN':        { en: 'Hygiene Products',     icon: 'sparkles-outline',      emoji: '✨', order: 6 },
  'BARANGAN KEDAI SERBANEKA': { en: 'Miscellaneous Items',  icon: 'storefront-outline',    emoji: '🏪', order: 7 },
};

async function main() {
  console.log('🔄  Connecting…');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected.\n');

  for (const [malay, meta] of Object.entries(RENAME)) {
    // Try to find by Malay name first, then by English (idempotent)
    let cat = await Category.findOne({ categoryName: malay });
    if (!cat) {
      cat = await Category.findOne({ categoryName: meta.en });
    }
    if (!cat) {
      // Create it fresh
      cat = await Category.create({
        categoryName: meta.en,
        icon: meta.icon,
        emoji: meta.emoji,
        order: meta.order,
      });
      console.log(`  ➕ Created: ${meta.en}`);
    } else {
      // Rename
      await Category.updateOne({ _id: cat._id }, {
        $set: { categoryName: meta.en, icon: meta.icon, emoji: meta.emoji, order: meta.order }
      });
      console.log(`  ✏️  Renamed: ${malay} → ${meta.en}`);
    }

    // Update all products pointing at this category's itemGroup
    const { modifiedCount } = await Product.updateMany(
      { itemGroup: malay },
      { $set: { categoryId: cat._id } }
    );
    console.log(`     Updated ${modifiedCount} products → ${meta.en}`);
  }

  // Remove any stale categories not in our 8 (old custom ones without products)
  const validNames = Object.values(RENAME).map(m => m.en);
  const stale = await Category.find({ categoryName: { $nin: validNames } });
  for (const s of stale) {
    const count = await Product.countDocuments({ categoryId: s._id });
    if (count === 0) {
      await Category.deleteOne({ _id: s._id });
      console.log(`  🗑️  Deleted empty category: ${s.categoryName}`);
    } else {
      console.log(`  ⚠️  Kept non-empty category: ${s.categoryName} (${count} products)`);
    }
  }

  console.log('\n🎉  Migration complete!');
  await mongoose.disconnect();
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });

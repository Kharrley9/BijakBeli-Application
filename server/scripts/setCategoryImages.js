/**
 * setCategoryImages.js
 * ─────────────────────────────────────────────────────────────────────────
 * Sets a representative photo on each of the 8 main categories (shown in the
 * HomeScreen category grid). Idempotent — safe to re-run.
 *
 * Photos are free-licensed stock (Unsplash License / Pexels License), each one
 * checked by eye — never taken from retailer or Price Catcher artwork.
 *
 * Usage: node server/scripts/setCategoryImages.js
 */
'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Category = require('../models/Category');

const unsplash = (id) =>
  `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&q=80&auto=format`;
const pexels = (id, file = `pexels-photo-${id}.jpeg`) =>
  `https://images.pexels.com/photos/${id}/${file}?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`;

const IMAGES = {
  'Fresh Produce':        unsplash('1624668430039-0175a0fbf006'), // harvest crate of vegetables
  'Dry Goods':            unsplash('1586201375761-83865001e31c'), // uncooked rice
  'Packaged Goods':       pexels(13499754),                       // opened sardine tin
  'Beverages':            pexels(4443490),                        // four unbranded juice bottles
  'Ready-to-Cook Food':   pexels(23014601),                       // instant-noodle shelf
  'Milk & Baby Products': pexels(41222, 'belly-care-feeding-bottle-41222.jpeg'), // baby bottle
  'Hygiene Products':     pexels(5218014),                        // cleaning supplies
  'Miscellaneous Items':  unsplash('1703319953569-72084ac406b6'), // lollipops
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  for (const [categoryName, image] of Object.entries(IMAGES)) {
    const { matchedCount } = await Category.updateOne({ categoryName }, { $set: { image } });
    console.log(`${matchedCount ? '✅' : '⚠️  not found:'} ${categoryName}`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

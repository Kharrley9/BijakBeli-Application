'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product  = require('../models/Product');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // Old subcategories → merge into Packaged Goods
  const pkg  = await Category.findOne({ categoryName: 'Packaged Goods' });
  const misc = await Category.findOne({ categoryName: 'Miscellaneous Items' });

  const toPackaged = [
    'Baking Ingredients', 'Biscuits & Cakes', 'Canned Food',
    'Cereals', 'Jams, Spreads & Honey', 'Pasta & Instant Food',
    'Sauce, Spice & Seasoning',
  ];
  const toMisc = ['Chocolates, Sweets & Jelly', 'Snacks', 'Commodities'];

  for (const name of toPackaged) {
    const cat = await Category.findOne({ categoryName: name });
    if (!cat) continue;
    const { modifiedCount } = await Product.updateMany(
      { categoryId: cat._id }, { $set: { categoryId: pkg._id } }
    );
    await Category.deleteOne({ _id: cat._id });
    console.log(`Merged "${name}" (${modifiedCount} products) → Packaged Goods`);
  }

  for (const name of toMisc) {
    const cat = await Category.findOne({ categoryName: name });
    if (!cat) continue;
    const { modifiedCount } = await Product.updateMany(
      { categoryId: cat._id }, { $set: { categoryId: misc._id } }
    );
    await Category.deleteOne({ _id: cat._id });
    console.log(`Merged "${name}" (${modifiedCount} products) → Miscellaneous Items`);
  }

  const remaining = await Category.find({});
  console.log('\nFinal categories:', remaining.map(c => c.categoryName));
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(e => { console.error(e.message); process.exit(1); });

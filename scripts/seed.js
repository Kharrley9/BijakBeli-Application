// BijakBeli v3 seed — grocery price comparison across 10 major Malaysian chains.
// Chain data is SAMPLE data (plausible branches/coords/prices); edit via admin.

const path = require('path');
module.paths.unshift(path.join(__dirname, '..', 'server', 'node_modules'));

const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const User = require('../server/models/User');
const Store = require('../server/models/Store');
const Category = require('../server/models/Category');
const Brand = require('../server/models/Brand');
const Product = require('../server/models/Product');
const Price = require('../server/models/Price');
const Promotion = require('../server/models/Promotion');
const Settings = require('../server/models/Settings');
const ShoppingList = require('../server/models/ShoppingList');
const ShoppingListItem = require('../server/models/ShoppingListItem');
const Budget = require('../server/models/Budget');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bijakbeli';

const rnd = (min, max) => Math.random() * (max - min) + min;
const jitter = (v, pct) => parseFloat((v * (1 + rnd(-pct, pct))).toFixed(2));
const near = (lng, lat) => [
  parseFloat((lng + rnd(-0.04, 0.04)).toFixed(5)),
  parseFloat((lat + rnd(-0.04, 0.04)).toFixed(5)),
];

// ---------------------------------------------------------------------------
// Malaysian cities used to place chain branches  { city, state, [lng, lat] }
// ---------------------------------------------------------------------------
const CITIES = {
  'Batu Pahat': ['Johor', 102.9336, 1.8509],
  'Johor Bahru': ['Johor', 103.7414, 1.4927],
  Muar: ['Johor', 102.5686, 2.0442],
  Kluang: ['Johor', 103.3336, 2.0301],
  'Alor Setar': ['Kedah', 100.3673, 6.1264],
  'Sungai Petani': ['Kedah', 100.4793, 5.6474],
  'Kota Bharu': ['Kelantan', 102.2386, 6.1254],
  'Melaka City': ['Melaka', 102.2501, 2.1896],
  Seremban: ['Negeri Sembilan', 101.9424, 2.7297],
  Kuantan: ['Pahang', 103.3260, 3.8077],
  'Ipoh': ['Perak', 101.0901, 4.5975],
  Taiping: ['Perak', 100.7377, 4.8500],
  Kangar: ['Perlis', 100.1988, 6.4414],
  'George Town': ['Pulau Pinang', 100.3327, 5.4141],
  'Bukit Mertajam': ['Pulau Pinang', 100.4667, 5.3625],
  'Kota Kinabalu': ['Sabah', 116.0735, 5.9804],
  Sandakan: ['Sabah', 118.1179, 5.8402],
  Kuching: ['Sarawak', 110.3592, 1.5533],
  Miri: ['Sarawak', 114.0000, 4.3999],
  'Shah Alam': ['Selangor', 101.5185, 3.0733],
  'Petaling Jaya': ['Selangor', 101.6068, 3.1073],
  Klang: ['Selangor', 101.4451, 3.0449],
  'Kuala Lumpur': ['W.P. Kuala Lumpur', 101.6869, 3.1390],
  Kepong: ['W.P. Kuala Lumpur', 101.6325, 3.2100],
  Cheras: ['W.P. Kuala Lumpur', 101.7383, 3.0833],
  'Kuala Terengganu': ['Terengganu', 103.1408, 5.3302],
};

// The 10 major grocery chains this app focuses on, with the cities each has
// branches in (sample data — plausible, edit via admin).
const CHAINS = [
  { name: 'AEON BiG', type: 'hypermarket', cities: ['Petaling Jaya', 'Kuala Lumpur', 'Klang', 'Johor Bahru', 'Melaka City', 'Ipoh'] },
  { name: "Lotus's", type: 'hypermarket', cities: ['Batu Pahat', 'Johor Bahru', 'Kuala Lumpur', 'Kepong', 'George Town', 'Ipoh', 'Seremban', 'Kuantan', 'Shah Alam', 'Kota Bharu'] },
  { name: 'MYDIN', type: 'hypermarket', cities: ['Johor Bahru', 'Bukit Mertajam', 'Alor Setar', 'Kota Bharu', 'Kuala Terengganu', 'Seremban', 'Kuala Lumpur', 'Kuantan'] },
  { name: 'Giant', type: 'hypermarket', cities: ['Batu Pahat', 'Shah Alam', 'Petaling Jaya', 'Klang', 'Kuala Lumpur', 'George Town', 'Kuantan', 'Melaka City', 'Kota Kinabalu'] },
  { name: 'Econsave', type: 'hypermarket', cities: ['Batu Pahat', 'Muar', 'Kluang', 'Seremban', 'Melaka City', 'Klang', 'Sungai Petani', 'Taiping'] },
  { name: 'NSK Trade City', type: 'hypermarket', cities: ['Batu Pahat', 'Kuala Lumpur', 'Cheras', 'Kepong', 'Klang'] },
  { name: 'TF Value-Mart', type: 'supermarket', cities: ['Ipoh', 'Taiping', 'Kuantan', 'Seremban', 'Kepong', 'Alor Setar'] },
  { name: 'Servay', type: 'supermarket', cities: ['Kota Kinabalu', 'Sandakan'] },
  { name: 'Billion', type: 'supermarket', cities: ['Muar', 'Kluang', 'Melaka City', 'Seremban', 'Kuantan'] },
  { name: 'The Store', type: 'supermarket', cities: ['Batu Pahat', 'Kota Bharu', 'Kangar', 'Alor Setar'] },
];

// ---------------------------------------------------------------------------
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  await Promise.all([
    User.deleteMany(), Store.deleteMany(), Category.deleteMany(), Brand.deleteMany(),
    Product.deleteMany(), Price.deleteMany(), Promotion.deleteMany(), Settings.deleteMany(),
    ShoppingList.deleteMany(), ShoppingListItem.deleteMany(), Budget.deleteMany(),
  ]);
  console.log('🗑️  Cleared existing data');

  // ---- USERS ----
  const admin = await User.create({ fullName: 'Admin BijakBeli', email: 'admin@bijakbeli.com', password: 'admin123', role: 'admin', phone: '+60127654321' });
  const customer = await User.create({
    fullName: 'Khalil Ahmad', email: 'khalil@example.com', password: 'password123', role: 'customer',
    phone: '+60121234567', address: 'Jalan Rahmat, Batu Pahat, Johor', preferredState: 'Johor',
    businessLocation: { type: 'Point', coordinates: [102.9336, 1.8509], label: 'Jalan Rahmat, 83000 Batu Pahat, Johor' },
  });
  await User.create({ fullName: 'Ahmad Razif', email: 'ahmad@example.com', password: 'customer123', role: 'customer', phone: '+60129876543', address: 'Taman Bukit Pasir, Batu Pahat, Johor' });
  console.log('👤 3 users (admin, 2 customers)');

  // ---- CHAIN STORES ----
  const chainDocs = [];
  for (const chain of CHAINS) {
    for (const city of chain.cities) {
      const [state, lng, lat] = CITIES[city];
      chainDocs.push({
        storeName: chain.name,
        mallName: `${chain.name} ${city}`,
        branch: city,
        type: chain.type,
        state, city,
        address: `${chain.name}, ${city}, ${state}`,
        location: { type: 'Point', coordinates: near(lng, lat) },
        operating_hours: '9:00 AM - 10:00 PM',
        isActive: true,
        status: 'active',
      });
    }
  }
  const chains = await Store.insertMany(chainDocs);
  console.log(`🏪 ${chains.length} chain branches (${CHAINS.length} chains) across ${new Set(chainDocs.map((s) => s.state)).size} states`);

  // ---- CATEGORIES (grocery product categories) ----
  const CATS = [
    ['Rice & Grains', 'nutrition-outline'],
    ['Cooking Oil', 'water-outline'],
    ['Sugar & Flour', 'cube-outline'],
    ['Beverages', 'cafe-outline'],
    ['Dairy & Eggs', 'egg-outline'],
    ['Snacks & Biscuits', 'fast-food-outline'],
    ['Canned Food', 'file-tray-outline'],
    ['Noodles & Pasta', 'restaurant-outline'],
    ['Sauces & Condiments', 'color-fill-outline'],
    ['Personal Care', 'body-outline'],
    ['Household', 'home-outline'],
    ['Bread & Bakery', 'pizza-outline'],
    ['Fruits & Vegetables', 'leaf-outline'],
    ['Meat & Seafood', 'fish-outline'],
  ];
  const categories = await Category.insertMany(
    CATS.map(([categoryName, icon], i) => ({ categoryName, icon, order: i }))
  );
  const cat = (n) => categories.find((c) => c.categoryName === n)._id;
  console.log(`📁 ${categories.length} product categories`);

  // ---- BRANDS ----
  const brandNames = [
    'Jasmine', 'Knife', 'CSR', 'Milo', 'Dutch Lady', 'Maggi', 'Adabi', "Munchy's", 'Ayam Brand',
    'Cap Kipas Udang', 'Saji', 'Gardenia', 'Nestle', 'F&N', 'Dettol', 'Dynamo', 'Kimball', "Yeo's",
    'Vesawit', 'Goodday', 'Cintan', 'Colgate', 'Head & Shoulders', '100Plus', 'Clorox', "Julie's",
    'Cap Rambutan', 'Gula Prai', 'Sunquick', 'Breeze',
  ];
  const brands = await Brand.insertMany(brandNames.map((brandName) => ({ brandName })));
  const brand = (n) => brands.find((b) => b.brandName === n)._id;
  console.log(`🏷️  ${brands.length} brands`);

  // ---- GROCERY CATALOGUE ----
  const grocery = [
    ['Jasmine Super Special Local White Rice 5kg', 'Rice & Grains', 'Jasmine', 'bag', 24.9],
    ['Jasmine Super 5 Imported Rice 10kg', 'Rice & Grains', 'Jasmine', 'bag', 47.9],
    ['Cap Rambutan Beras Wangi 5kg', 'Rice & Grains', 'Cap Rambutan', 'bag', 26.9],
    ['Jasmine Beras Super Special 10kg', 'Rice & Grains', 'Jasmine', 'bag', 46.9],
    ['Jasmine Basmathi Rice 5kg', 'Rice & Grains', 'Jasmine', 'bag', 32.9],
    ['Knife Cooking Oil 5kg', 'Cooking Oil', 'Knife', 'bottle', 29.5],
    ['Saji Cooking Oil 5kg', 'Cooking Oil', 'Saji', 'bottle', 27.9],
    ['Vesawit Cooking Oil 5kg', 'Cooking Oil', 'Vesawit', 'bottle', 26.5],
    ['Knife Cooking Oil 2kg', 'Cooking Oil', 'Knife', 'bottle', 13.9],
    ['CSR Fine Grain Sugar 1kg', 'Sugar & Flour', 'CSR', 'pack', 2.85],
    ['Gula Prai White Sugar 1kg', 'Sugar & Flour', 'Gula Prai', 'pack', 2.8],
    ['Cap Kipas Udang Superfine Flour 1kg', 'Sugar & Flour', 'Cap Kipas Udang', 'pack', 2.2],
    ['CSR Gula Kastor 500g', 'Sugar & Flour', 'CSR', 'pack', 3.5],
    ['Milo Activ-Go Powder 2kg', 'Beverages', 'Milo', 'pack', 28.9],
    ['Milo Activ-Go Powder 1kg', 'Beverages', 'Milo', 'pack', 15.9],
    ['Nestle Nescafe Classic 200g', 'Beverages', 'Nestle', 'bottle', 18.9],
    ["Yeo's Soy Milk 1L", 'Beverages', "Yeo's", 'bottle', 4.5],
    ['100Plus Isotonic Drink 1.5L', 'Beverages', '100Plus', 'bottle', 3.5],
    ['Sunquick Orange Cordial 840ml', 'Beverages', 'Sunquick', 'bottle', 9.9],
    ['F&N Sweetened Condensed Milk 500g', 'Dairy & Eggs', 'F&N', 'can', 4.8],
    ['Dutch Lady Pure Farm Full Cream Milk 1L', 'Dairy & Eggs', 'Dutch Lady', 'bottle', 6.2],
    ['Dutch Lady Pure Farm Low Fat Milk 1L', 'Dairy & Eggs', 'Dutch Lady', 'bottle', 6.5],
    ['Goodday Full Cream Milk 1L', 'Dairy & Eggs', 'Goodday', 'bottle', 5.9],
    ['Dutch Lady Chocolate Milk 200ml (6-pack)', 'Dairy & Eggs', 'Dutch Lady', 'pack', 7.5],
    ['Grade A Chicken Eggs (30s)', 'Dairy & Eggs', null, 'tray', 13.5],
    ['Maggi 2 Minute Noodles Curry (5x79g)', 'Noodles & Pasta', 'Maggi', 'pack', 5.2],
    ['Maggi 2 Minute Noodles Asam Laksa (5x78g)', 'Noodles & Pasta', 'Maggi', 'pack', 5.4],
    ['Maggi 2 Minute Noodles Tom Yam (5x80g)', 'Noodles & Pasta', 'Maggi', 'pack', 5.3],
    ['Cintan Mi Sup (5x75g)', 'Noodles & Pasta', 'Cintan', 'pack', 4.5],
    ['Maggi Mee Goreng (5x72g)', 'Noodles & Pasta', 'Maggi', 'pack', 5.5],
    ['Adabi Curry Powder 250g', 'Sauces & Condiments', 'Adabi', 'pack', 4.5],
    ['Kimball Tomato Ketchup 500g', 'Sauces & Condiments', 'Kimball', 'bottle', 4.2],
    ['Maggi Oyster Sauce 500g', 'Sauces & Condiments', 'Maggi', 'bottle', 6.8],
    ['Adabi Serbuk Kunyit 250g', 'Sauces & Condiments', 'Adabi', 'pack', 3.9],
    ['Kimball Chilli Sauce 500g', 'Sauces & Condiments', 'Kimball', 'bottle', 4.0],
    ["Munchy's Cream Crackers 300g", 'Snacks & Biscuits', "Munchy's", 'pack', 4.8],
    ['Nestle Kit Kat 4F 35g (4 pack)', 'Snacks & Biscuits', 'Nestle', 'pack', 5.9],
    ["Julie's Butter Crackers 250g", 'Snacks & Biscuits', "Julie's", 'pack', 5.5],
    ["Munchy's Lexus Cream Sandwich 190g", 'Snacks & Biscuits', "Munchy's", 'pack', 3.5],
    ['Ayam Brand Sardines in Tomato Sauce 425g', 'Canned Food', 'Ayam Brand', 'can', 7.9],
    ['Ayam Brand Tuna Chunks in Water 185g', 'Canned Food', 'Ayam Brand', 'can', 7.5],
    ['Adabi Sambal Ikan Bilis 160g', 'Canned Food', 'Adabi', 'can', 4.5],
    ['Ayam Brand Baked Beans 425g', 'Canned Food', 'Ayam Brand', 'can', 4.2],
    ['Dettol Antibacterial Shower Gel 950ml', 'Personal Care', 'Dettol', 'bottle', 19.9],
    ['Head & Shoulders Shampoo 330ml', 'Personal Care', 'Head & Shoulders', 'bottle', 15.9],
    ['Colgate Maximum Cavity Protection 250g', 'Personal Care', 'Colgate', 'unit', 8.5],
    ['Dynamo Liquid Detergent 2.7kg', 'Household', 'Dynamo', 'bottle', 25.9],
    ['Breeze Powder Detergent 2.5kg', 'Household', 'Breeze', 'pack', 18.9],
    ['Clorox Bleach Original 1L', 'Household', 'Clorox', 'bottle', 6.9],
    ['Gardenia Original Classic Bread 400g', 'Bread & Bakery', 'Gardenia', 'pack', 3.2],
    ['Gardenia Wholemeal Bread 400g', 'Bread & Bakery', 'Gardenia', 'pack', 3.8],
    ['Local Round Cabbage', 'Fruits & Vegetables', null, 'kg', 4.5],
    ['Australian Carrot', 'Fruits & Vegetables', null, 'kg', 5.9],
    ['Pisang Berangan', 'Fruits & Vegetables', null, 'kg', 6.5],
    ['Fresh Chicken Whole', 'Meat & Seafood', null, 'kg', 9.9],
    ['Beef Topside Local', 'Meat & Seafood', null, 'kg', 38.0],
  ];

  const groceryProducts = await Product.insertMany(
    grocery.map(([productName, category, brandName, unit], i) => ({
      barcode: `95500${String(i + 100).padStart(4, '0')}`,
      productName,
      description: productName,
      categoryId: cat(category),
      brandId: brandName ? brand(brandName) : null,
      unit,
      status: 'active',
    }))
  );
  const groceryBase = Object.fromEntries(grocery.map(([n, , , , p]) => [n, p]));
  console.log(`🛒 ${groceryProducts.length} grocery products`);

  // ---- PRICES: every product at every chain ----
  const priceBulk = [];
  for (const prod of groceryProducts) {
    const base = groceryBase[prod.productName];
    for (const store of chains) {
      const price = jitter(base, 0.06);
      priceBulk.push({
        productId: prod._id,
        storeId: store._id,
        price,
        previousPrice: Math.random() < 0.4 ? jitter(price, 0.05) : null,
        inStock: true,
      });
    }
  }
  await Price.insertMany(priceBulk);
  console.log(`💰 ${priceBulk.length} prices (${groceryProducts.length} products × ${chains.length} stores)`);

  // ---- PROMOTIONS (active) ----
  const now = new Date();
  const days = (n) => new Date(now.getTime() + n * 864e5);
  const promoTargets = [
    ['Milo Activ-Go Powder 2kg', 'discount', 0.14],
    ['Knife Cooking Oil 5kg', 'discount', 0.1],
    ['Jasmine Super Special Local White Rice 5kg', 'discount', 0.09],
    ['Maggi 2 Minute Noodles Curry (5x79g)', 'buy1free1', 0.13],
    ['Dettol Antibacterial Shower Gel 950ml', 'discount', 0.18],
    ['Nestle Nescafe Classic 200g', 'discount', 0.12],
    ['Ayam Brand Sardines in Tomato Sauce 425g', 'bundle', 0.13],
    ['Dynamo Liquid Detergent 2.7kg', 'clearance', 0.13],
    ['Dutch Lady Pure Farm Full Cream Milk 1L', 'discount', 0.11],
    ['Gardenia Original Classic Bread 400g', 'discount', 0.09],
    ['CSR Fine Grain Sugar 1kg', 'discount', 0.07],
    ['100Plus Isotonic Drink 1.5L', 'discount', 0.15],
  ];
  const promoDocs = [];
  for (const [name, type, pct] of promoTargets) {
    const prod = groceryProducts.find((p) => p.productName === name);
    if (!prod) continue;
    // put the promo on 2-3 random chains
    const shuffled = [...chains].sort(() => Math.random() - 0.5).slice(0, 3);
    for (const store of shuffled) {
      const base = groceryBase[name];
      promoDocs.push({
        productId: prod._id,
        storeId: store._id,
        promotionTitle: `${name.split(' ').slice(0, 2).join(' ')} Deal`,
        promotionType: type,
        promotionPrice: parseFloat((base * (1 - pct)).toFixed(2)),
        discountPercentage: Math.round(pct * 100),
        startDate: now,
        endDate: days(10 + Math.floor(rnd(0, 12))),
      });
    }
  }
  await Promotion.insertMany(promoDocs);
  console.log(`🎉 ${promoDocs.length} promotions`);

  // ---- DEMO buyer extras ----
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  await Budget.create({ userId: customer._id, monthlyBudget: 300, spentAmount: 90, remainingAmount: 210, month: m, year: y });
  await Settings.create({ applicationName: 'BijakBeli', theme: 'light', maintenanceMode: false });

  console.log('\n🌟 Seed complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Admin:    admin@bijakbeli.com / admin123');
  console.log('📧 Customer: khalil@example.com / password123  (Batu Pahat)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏪 ${chains.length} chain branches (${CHAINS.length} chains)`);
  console.log(`🛒 ${groceryProducts.length} products, ${priceBulk.length} prices, ${promoDocs.length} promotions`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});

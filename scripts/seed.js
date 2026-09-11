// BijakBeli v2 seed — Malaysia-wide chain grocery data + demo trader stores.
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
const Order = require('../server/models/Order');

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

// chain -> list of cities it has branches in (1-2 branches each)
const CHAINS = [
  { name: "Lotus's", type: 'hypermarket', cities: ['Batu Pahat', 'Johor Bahru', 'Kuala Lumpur', 'Kepong', 'George Town', 'Ipoh', 'Seremban', 'Kuantan', 'Shah Alam', 'Kota Bharu'] },
  { name: 'AEON', type: 'hypermarket', cities: ['Johor Bahru', 'Kuala Lumpur', 'Cheras', 'Shah Alam', 'George Town', 'Ipoh', 'Seremban', 'Kuching', 'Kota Kinabalu'] },
  { name: 'AEON BiG', type: 'hypermarket', cities: ['Petaling Jaya', 'Kuala Lumpur', 'Klang', 'Johor Bahru', 'Melaka City'] },
  { name: 'Mydin', type: 'hypermarket', cities: ['Johor Bahru', 'Bukit Mertajam', 'Alor Setar', 'Kota Bharu', 'Kuala Terengganu', 'Seremban', 'Kuala Lumpur', 'Kuantan'] },
  { name: 'Giant', type: 'hypermarket', cities: ['Batu Pahat', 'Shah Alam', 'Petaling Jaya', 'Klang', 'Kuala Lumpur', 'George Town', 'Kuantan', 'Melaka City', 'Kota Kinabalu'] },
  { name: 'Econsave', type: 'hypermarket', cities: ['Batu Pahat', 'Muar', 'Kluang', 'Seremban', 'Melaka City', 'Klang', 'Sungai Petani', 'Taiping'] },
  { name: 'NSK Trade City', type: 'hypermarket', cities: ['Batu Pahat', 'Kuala Lumpur', 'Cheras', 'Kepong', 'Klang'] },
  { name: 'TF Value-Mart', type: 'supermarket', cities: ['Ipoh', 'Taiping', 'Kuantan', 'Seremban', 'Kepong', 'Alor Setar'] },
  { name: 'Billion', type: 'supermarket', cities: ['Muar', 'Kluang', 'Melaka City', 'Seremban', 'Kuantan'] },
  { name: 'Sunshine', type: 'supermarket', cities: ['George Town', 'Bukit Mertajam'] },
  { name: 'Servay', type: 'supermarket', cities: ['Kota Kinabalu', 'Sandakan'] },
  { name: 'Emart', type: 'supermarket', cities: ['Kuching', 'Miri'] },
  { name: 'Pacific', type: 'supermarket', cities: ['Batu Pahat', 'Kota Bharu', 'Kangar', 'Alor Setar'] },
  { name: '99 Speedmart', type: 'minimart', cities: ['Batu Pahat', 'Johor Bahru', 'Petaling Jaya', 'Kuala Lumpur', 'George Town', 'Ipoh', 'Seremban', 'Kuantan', 'Kuching', 'Kota Kinabalu'] },
  { name: 'KK Super Mart', type: 'convenience store', cities: ['Kuala Lumpur', 'Cheras', 'Petaling Jaya', 'Johor Bahru', 'George Town'] },
];

// ---------------------------------------------------------------------------
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  await Promise.all([
    User.deleteMany(), Store.deleteMany(), Category.deleteMany(), Brand.deleteMany(),
    Product.deleteMany(), Price.deleteMany(), Promotion.deleteMany(), Settings.deleteMany(),
    ShoppingList.deleteMany(), ShoppingListItem.deleteMany(), Budget.deleteMany(), Order.deleteMany(),
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
  const merchant = await User.create({
    fullName: 'Pak Mat Trader', email: 'merchant@bijakbeli.com', password: 'merchant123', role: 'merchant',
    phone: '+60137778888', address: 'Batu Pahat, Johor',
    businessLocation: { type: 'Point', coordinates: [102.9350, 1.8560], label: 'Jalan Rahmat, Batu Pahat' },
  });
  console.log('👤 4 users (admin, 2 customers, 1 merchant)');

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
        kind: 'chain',
        ownerId: null,
        storeCategory: 'grocery',
        state, city,
        address: `${chain.name}, ${city}, ${state}`,
        location: { type: 'Point', coordinates: near(lng, lat) },
        operating_hours: '9:00 AM - 10:00 PM',
        rating: parseFloat(rnd(3.6, 4.7).toFixed(1)),
        reviewCount: Math.floor(rnd(20, 400)),
        deliveryAvailable: false,
        pickupAvailable: false,
        isActive: true,
        status: 'active',
      });
    }
  }
  const chains = await Store.insertMany(chainDocs);
  console.log(`🏪 ${chains.length} chain branches across ${new Set(chainDocs.map((s) => s.state)).size} states`);

  // ---- CATEGORIES (product categories, grouped by store category) ----
  const CATS = [
    // grocery
    ['Rice & Grains', 'grocery', 'nutrition-outline'],
    ['Cooking Oil', 'grocery', 'water-outline'],
    ['Sugar & Flour', 'grocery', 'cube-outline'],
    ['Beverages', 'grocery', 'cafe-outline'],
    ['Dairy & Eggs', 'grocery', 'egg-outline'],
    ['Snacks & Biscuits', 'grocery', 'fast-food-outline'],
    ['Canned Food', 'grocery', 'file-tray-outline'],
    ['Noodles & Pasta', 'grocery', 'restaurant-outline'],
    ['Sauces & Condiments', 'grocery', 'color-fill-outline'],
    ['Personal Care', 'grocery', 'body-outline'],
    ['Household', 'grocery', 'home-outline'],
    ['Bread & Bakery', 'grocery', 'pizza-outline'],
    ['Fruits & Vegetables', 'grocery', 'leaf-outline'],
    ['Meat & Seafood', 'grocery', 'fish-outline'],
    // automotive
    ['Engine Oil & Fluids', 'automotive', 'car-outline'],
    ['Tyres & Wheels', 'automotive', 'ellipse-outline'],
    ['Batteries', 'automotive', 'battery-charging-outline'],
    ['Car Accessories', 'automotive', 'settings-outline'],
    // hardware
    ['Power Tools', 'hardware', 'construct-outline'],
    ['Hand Tools', 'hardware', 'hammer-outline'],
    ['Paint & Adhesives', 'hardware', 'brush-outline'],
    ['Plumbing', 'hardware', 'water-outline'],
    // electrical
    ['Lighting', 'electrical', 'bulb-outline'],
    ['Wiring & Cables', 'electrical', 'git-branch-outline'],
    ['Switches & Sockets', 'electrical', 'toggle-outline'],
    // home
    ['Kitchenware', 'home', 'cafe-outline'],
    ['Cleaning Supplies', 'home', 'sparkles-outline'],
    // health
    ['Vitamins & Supplements', 'health', 'medkit-outline'],
    ['First Aid', 'health', 'bandage-outline'],
  ];
  const categories = await Category.insertMany(
    CATS.map(([categoryName, group, icon], i) => ({ categoryName, group, icon, order: i }))
  );
  const cat = (n) => categories.find((c) => c.categoryName === n)._id;
  const catGroup = (n) => categories.find((c) => c.categoryName === n).group;
  console.log(`📁 ${categories.length} product categories`);

  // ---- BRANDS ----
  const brandNames = [
    'Jasmine', 'Knife', 'CSR', 'Milo', 'Dutch Lady', 'Maggi', 'Adabi', "Munchy's", 'Ayam Brand',
    'Cap Kipas Udang', 'Saji', 'Gardenia', 'Nestle', 'F&N', 'Dettol', 'Dynamo', 'Kimball', "Yeo's",
    'Vesawit', 'Goodday', 'Cintan', 'Colgate', 'Head & Shoulders', '100Plus', 'Clorox', "Julie's",
    'Cap Rambutan', 'Gula Prai', 'Sunquick', 'Breeze',
    'Shell', 'Castrol', 'Petronas', 'Amaron', 'Century', 'Bosch', 'Makita', 'Stanley', 'Nippon Paint', 'Philips', 'Panasonic',
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
      storeCategory: 'grocery',
      brandId: brandName ? brand(brandName) : null,
      unit,
      status: 'active',
    }))
  );
  const groceryBase = Object.fromEntries(grocery.map(([n, , , , p]) => [n, p]));
  console.log(`🛒 ${groceryProducts.length} grocery products`);

  // ---- GROCERY PRICES: every grocery product at every grocery chain ----
  const groceryChains = chains.filter((s) => s.storeCategory === 'grocery');
  const priceBulk = [];
  for (const prod of groceryProducts) {
    const base = groceryBase[prod.productName];
    for (const store of groceryChains) {
      const price = jitter(base, 0.06);
      priceBulk.push({
        productId: prod._id,
        storeId: store._id,
        price,
        previousPrice: Math.random() < 0.4 ? jitter(price, 0.05) : null,
        stock: null,
        inStock: true,
      });
    }
  }
  await Price.insertMany(priceBulk);
  console.log(`💰 ${priceBulk.length} chain prices (${groceryProducts.length} products × ${groceryChains.length} stores)`);

  // ---- DEMO TRADER STORES (owned by merchant, Batu Pahat) ----
  const traderStoreDefs = [
    { storeName: 'AutoCare Batu Pahat', storeCategory: 'automotive', type: 'independent', c: [102.9410, 1.8580], deliveryFee: 8, desc: 'Car servicing parts, engine oil, batteries & tyres.' },
    { storeName: 'BP Hardware & Tools', storeCategory: 'hardware', type: 'independent', c: [102.9295, 1.8520], deliveryFee: 10, desc: 'Power tools, hand tools, paint and plumbing supplies.' },
    { storeName: 'BrightHome Electrical', storeCategory: 'electrical', type: 'independent', c: [102.9360, 1.8470], deliveryFee: 12, desc: 'Lighting, wiring, switches and home electrical goods.' },
    { storeName: 'Kedai Runcit Pak Mat', storeCategory: 'grocery', type: 'independent', c: [102.9330, 1.8555], deliveryFee: 5, desc: 'Neighbourhood grocery store with daily essentials.' },
  ];
  const traderStores = await Store.insertMany(
    traderStoreDefs.map((d) => ({
      storeName: d.storeName,
      branch: 'Batu Pahat',
      type: d.type,
      kind: 'merchant',
      ownerId: merchant._id,
      storeCategory: d.storeCategory,
      description: d.desc,
      phone: merchant.phone,
      state: 'Johor',
      city: 'Batu Pahat',
      address: `${d.storeName}, Batu Pahat, Johor`,
      location: { type: 'Point', coordinates: d.c },
      operating_hours: '9:00 AM - 7:00 PM',
      deliveryAvailable: true,
      deliveryFee: d.deliveryFee,
      pickupAvailable: true,
      minOrder: 0,
      rating: parseFloat(rnd(4.0, 4.9).toFixed(1)),
      reviewCount: Math.floor(rnd(5, 60)),
      isActive: true,
      status: 'active',
    }))
  );
  const traderByName = Object.fromEntries(traderStores.map((s) => [s.storeName, s]));
  console.log(`🏬 ${traderStores.length} demo trader stores`);

  // ---- TRADER PRODUCTS + PRICES + STOCK ----
  const traderCatalogue = [
    // [store, name, category, brand, unit, price]
    ['AutoCare Batu Pahat', 'Shell Helix HX7 10W-40 Engine Oil 4L', 'Engine Oil & Fluids', 'Shell', 'bottle', 89.9],
    ['AutoCare Batu Pahat', 'Castrol GTX 15W-40 Engine Oil 4L', 'Engine Oil & Fluids', 'Castrol', 'bottle', 79.9],
    ['AutoCare Batu Pahat', 'Petronas Syntium 800 10W-40 4L', 'Engine Oil & Fluids', 'Petronas', 'bottle', 95.0],
    ['AutoCare Batu Pahat', 'Amaron Car Battery NS60 45Ah', 'Batteries', 'Amaron', 'unit', 260.0],
    ['AutoCare Batu Pahat', 'Century Car Battery NS40 35Ah', 'Batteries', 'Century', 'unit', 190.0],
    ['AutoCare Batu Pahat', 'Silicone Wiper Blade 20 inch', 'Car Accessories', null, 'pcs', 25.0],
    ['AutoCare Batu Pahat', 'Car Air Filter (Myvi/Axia)', 'Car Accessories', null, 'pcs', 22.0],
    ['AutoCare Batu Pahat', 'Coolant Radiator Fluid 1L', 'Engine Oil & Fluids', null, 'bottle', 12.5],
    ['AutoCare Batu Pahat', 'Brake Fluid DOT 4 500ml', 'Engine Oil & Fluids', null, 'bottle', 15.0],
    ['AutoCare Batu Pahat', 'Passenger Tyre 185/65 R15', 'Tyres & Wheels', null, 'unit', 230.0],

    ['BP Hardware & Tools', 'Bosch GSB 550 Impact Drill', 'Power Tools', 'Bosch', 'unit', 279.0],
    ['BP Hardware & Tools', 'Makita HP1630 Hammer Drill', 'Power Tools', 'Makita', 'unit', 349.0],
    ['BP Hardware & Tools', 'Stanley 16oz Claw Hammer', 'Hand Tools', 'Stanley', 'pcs', 39.9],
    ['BP Hardware & Tools', 'Stanley 22-piece Screwdriver Set', 'Hand Tools', 'Stanley', 'set', 89.0],
    ['BP Hardware & Tools', 'Measuring Tape 5m', 'Hand Tools', null, 'pcs', 14.9],
    ['BP Hardware & Tools', 'Nippon Paint Vinilex 5L White', 'Paint & Adhesives', 'Nippon Paint', 'tin', 79.0],
    ['BP Hardware & Tools', 'PVC Pipe 1/2 inch (3m)', 'Plumbing', null, 'length', 8.5],
    ['BP Hardware & Tools', 'PVC Elbow Joint 1/2 inch', 'Plumbing', null, 'pcs', 1.2],
    ['BP Hardware & Tools', 'Silicone Sealant Clear 300ml', 'Paint & Adhesives', null, 'tube', 12.9],
    ['BP Hardware & Tools', 'Safety Gloves (pair)', 'Hand Tools', null, 'pair', 6.5],

    ['BrightHome Electrical', 'Philips LED Bulb 9W E27 (Warm White)', 'Lighting', 'Philips', 'pcs', 12.9],
    ['BrightHome Electrical', 'Panasonic LED Downlight 12W', 'Lighting', 'Panasonic', 'pcs', 24.9],
    ['BrightHome Electrical', 'PVC Insulated Cable 2.5mm (100m)', 'Wiring & Cables', null, 'roll', 185.0],
    ['BrightHome Electrical', 'Panasonic 13A Switch Socket Outlet', 'Switches & Sockets', 'Panasonic', 'pcs', 18.5],
    ['BrightHome Electrical', '2-Gang 1-Way Wall Switch', 'Switches & Sockets', null, 'pcs', 9.9],
    ['BrightHome Electrical', 'Extension Socket 4-Way 3m', 'Switches & Sockets', null, 'pcs', 32.0],
    ['BrightHome Electrical', 'Ceiling Fan 56 inch (5 blade)', 'Lighting', null, 'unit', 189.0],
    ['BrightHome Electrical', 'Flexible Conduit 20mm (10m)', 'Wiring & Cables', null, 'roll', 22.0],

    ['Kedai Runcit Pak Mat', 'Jasmine Super Special Local White Rice 5kg', 'Rice & Grains', 'Jasmine', 'bag', 25.5],
    ['Kedai Runcit Pak Mat', 'Knife Cooking Oil 5kg', 'Cooking Oil', 'Knife', 'bottle', 30.5],
    ['Kedai Runcit Pak Mat', 'Milo Activ-Go Powder 1kg', 'Beverages', 'Milo', 'pack', 16.9],
    ['Kedai Runcit Pak Mat', 'Maggi 2 Minute Noodles Curry (5x79g)', 'Noodles & Pasta', 'Maggi', 'pack', 5.6],
    ['Kedai Runcit Pak Mat', 'Grade A Chicken Eggs (30s)', 'Dairy & Eggs', null, 'tray', 14.2],
    ['Kedai Runcit Pak Mat', 'Gardenia Original Classic Bread 400g', 'Bread & Bakery', 'Gardenia', 'pack', 3.4],
    ['Kedai Runcit Pak Mat', 'CSR Fine Grain Sugar 1kg', 'Sugar & Flour', 'CSR', 'pack', 3.1],
    ['Kedai Runcit Pak Mat', 'Dutch Lady Full Cream Milk 1L', 'Dairy & Eggs', 'Dutch Lady', 'bottle', 6.6],
  ];

  const traderProductDocs = traderCatalogue.map(([store, name, category, brandName, unit], i) => ({
    barcode: `95509${String(i + 100).padStart(4, '0')}`,
    productName: name,
    description: name,
    categoryId: cat(category),
    storeCategory: catGroup(category),
    brandId: brandName ? brand(brandName) : null,
    ownerId: merchant._id,
    unit,
    status: 'active',
  }));
  const traderProducts = await Product.insertMany(traderProductDocs);
  const traderPriceBulk = traderProducts.map((p, i) => {
    const [store, , , , , base] = traderCatalogue[i];
    return {
      productId: p._id,
      storeId: traderByName[store]._id,
      price: base,
      previousPrice: Math.random() < 0.3 ? jitter(base, 0.08) : null,
      stock: Math.floor(rnd(3, 40)),
      inStock: true,
    };
  });
  await Price.insertMany(traderPriceBulk);
  console.log(`📦 ${traderProducts.length} trader products + prices`);

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
    // put the promo on 2-3 random grocery chains
    const shuffled = [...groceryChains].sort(() => Math.random() - 0.5).slice(0, 3);
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
  // one trader promo
  const traderPromoProd = traderProducts.find((p) => p.productName.includes('Shell Helix'));
  if (traderPromoProd) {
    promoDocs.push({
      productId: traderPromoProd._id,
      storeId: traderByName['AutoCare Batu Pahat']._id,
      promotionTitle: 'Engine Oil Weekend Deal',
      promotionType: 'discount',
      promotionPrice: 82.9,
      discountPercentage: 8,
      startDate: now,
      endDate: days(14),
    });
  }
  await Promotion.insertMany(promoDocs);
  console.log(`🎉 ${promoDocs.length} promotions`);

  // ---- DEMO orders (buyer = customer/khalil, against the trader stores) ----
  function itemsFor(storeName, n) {
    const rows = traderPriceBulk.filter((r) => String(r.storeId) === String(traderByName[storeName]._id));
    return rows.slice(0, n).map((r) => {
      const prod = traderProducts.find((p) => String(p._id) === String(r.productId));
      const qty = Math.floor(rnd(1, 3));
      return { productId: r.productId, name: prod.productName, unit: prod.unit, unitPrice: r.price, qty, lineTotal: parseFloat((r.price * qty).toFixed(2)) };
    });
  }
  function buildOrder(storeName, fulfilment, status, itemCount, notes) {
    const store = traderByName[storeName];
    const items = itemsFor(storeName, itemCount);
    const subtotal = parseFloat(items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2));
    const deliveryFee = fulfilment === 'delivery' ? store.deliveryFee || 0 : 0;
    const flow = fulfilment === 'delivery'
      ? ['pending', 'confirmed', 'preparing', 'packing', 'on_the_way', 'completed']
      : ['pending', 'confirmed', 'preparing', 'packing', 'ready', 'completed'];
    const upTo = status === 'cancelled' ? ['pending'] : flow.slice(0, flow.indexOf(status) + 1);
    const statusHistory = upTo.map((s, i) => ({ status: s, at: days(-7 + i) }));
    if (status === 'cancelled') statusHistory.push({ status: 'cancelled', at: days(-6) });
    return {
      orderNumber: `BB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId: customer._id,
      storeId: store._id,
      items,
      subtotal,
      deliveryFee,
      total: parseFloat((subtotal + deliveryFee).toFixed(2)),
      fulfilment,
      deliveryAddress: fulfilment === 'delivery' ? { label: 'Jalan Rahmat, 83000 Batu Pahat, Johor', line: 'Jalan Rahmat, 83000 Batu Pahat, Johor', city: 'Batu Pahat', state: 'Johor' } : undefined,
      contactPhone: customer.phone || '017-2345678',
      paymentMethod: fulfilment === 'delivery' ? 'cod' : 'pay_at_pickup',
      status,
      statusHistory,
      cancelledBy: status === 'cancelled' ? 'buyer' : undefined,
      notes,
      createdAt: days(-7),
    };
  }
  const orderDocs = [
    buildOrder('AutoCare Batu Pahat', 'delivery', 'on_the_way', 2, 'Call on arrival'),
    buildOrder('Kedai Runcit Pak Mat', 'pickup', 'completed', 3),
    buildOrder('BP Hardware & Tools', 'pickup', 'cancelled', 1),
  ].filter((o) => o.items.length > 0);
  await Order.insertMany(orderDocs);
  console.log(`🧾 ${orderDocs.length} demo orders`);

  // ---- DEMO buyer extras ----
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  await Budget.create({ userId: customer._id, monthlyBudget: 300, spentAmount: 90, remainingAmount: 210, month: m, year: y });
  await Settings.create({ applicationName: 'BijakBeli', theme: 'light', maintenanceMode: false });

  console.log('\n🌟 Seed complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Admin:    admin@bijakbeli.com / admin123');
  console.log('📧 Customer: khalil@example.com / password123  (Batu Pahat)');
  console.log('📧 Merchant: merchant@bijakbeli.com / merchant123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏪 ${chains.length} chain branches + ${traderStores.length} trader stores`);
  console.log(`🛒 ${groceryProducts.length + traderProducts.length} products, ${priceBulk.length + traderPriceBulk.length} prices, ${promoDocs.length} promotions`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});

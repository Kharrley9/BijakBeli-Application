// seedDemo.js — Comprehensive demo seed for BijakBeli presentation
// Run: node scripts/seedDemo.js

const path = require('path');
module.paths.unshift(path.join(__dirname, '..', 'server', 'node_modules'));

const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

// Models
const User = require('../server/models/User');
const Store = require('../server/models/Store');
const Category = require('../server/models/Category');
const Brand = require('../server/models/Brand');
const Product = require('../server/models/Product');
const Price = require('../server/models/Price');
const Promotion = require('../server/models/Promotion');
const ShoppingList = require('../server/models/ShoppingList');
const ShoppingListItem = require('../server/models/ShoppingListItem');
const Budget = require('../server/models/Budget');
const Order = require('../server/models/Order');
const Settings = require('../server/models/Settings');
const Log = require('../server/models/Log');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bijakbeli';

const seedDemo = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ────────────────────────────────────────────────────────────────
    // CLEAR ALL EXISTING DATA
    // ────────────────────────────────────────────────────────────────
    await Promise.all([
      User.deleteMany(),
      Store.deleteMany(),
      Category.deleteMany(),
      Brand.deleteMany(),
      Product.deleteMany(),
      Price.deleteMany(),
      Promotion.deleteMany(),
      ShoppingList.deleteMany(),
      ShoppingListItem.deleteMany(),
      Budget.deleteMany(),
      Order.deleteMany(),
      Settings.deleteMany(),
    ]);
    // Try to clear Log if model exists
    try { await Log.deleteMany(); } catch (e) {}
    console.log('🗑️  Cleared ALL existing data');

    // ════════════════════════════════════════════════════════════════
    // 1. STORES — Real supermarkets in Batu Pahat, Johor
    // ════════════════════════════════════════════════════════════════
    const stores = await Store.create([
      {
        storeName: "Lotus's",
        mallName: "Lotus's Batu Pahat",
        branch: 'Batu Pahat',
        type: 'hypermarket',
        operating_hours: '8:00 AM - 10:00 PM',
        state: 'Johor',
        city: 'Batu Pahat',
        address: 'Lot PT 23992, Jalan Kluang, 83000 Batu Pahat, Johor',
        location: { type: 'Point', coordinates: [102.9358, 1.8548] },
      },
      {
        storeName: 'Econsave',
        mallName: 'Econsave Batu Pahat',
        branch: 'Batu Pahat',
        type: 'supermarket',
        operating_hours: '8:30 AM - 10:00 PM',
        state: 'Johor',
        city: 'Batu Pahat',
        address: 'Jalan Bakau Condong, Taman Bukit Pasir, 83000 Batu Pahat, Johor',
        location: { type: 'Point', coordinates: [102.9295, 1.8475] },
      },
      {
        storeName: 'Mydin',
        mallName: 'Mydin Batu Pahat',
        branch: 'Batu Pahat',
        type: 'hypermarket',
        operating_hours: '9:00 AM - 10:00 PM',
        state: 'Johor',
        city: 'Batu Pahat',
        address: 'No 1, Jalan Sultanah, 83000 Batu Pahat, Johor',
        location: { type: 'Point', coordinates: [102.9318, 1.8508] },
      },
      {
        storeName: '99 Speedmart',
        mallName: '99 Speedmart Batu Pahat',
        branch: 'Batu Pahat Town',
        type: 'minimart',
        operating_hours: '7:00 AM - 11:00 PM',
        state: 'Johor',
        city: 'Batu Pahat',
        address: 'Jalan Rahmat, 83000 Batu Pahat, Johor',
        location: { type: 'Point', coordinates: [102.9340, 1.8530] },
      },
      {
        storeName: 'KK Super Mart',
        mallName: 'KK Mart Batu Pahat',
        branch: 'Batu Pahat',
        type: 'minimart',
        operating_hours: '24 Hours',
        state: 'Johor',
        city: 'Batu Pahat',
        address: 'Jalan Mersing, 83000 Batu Pahat, Johor',
        location: { type: 'Point', coordinates: [102.9380, 1.8560] },
      },
      {
        storeName: 'Billion',
        mallName: 'Billion Shopping Centre',
        branch: 'Batu Pahat',
        type: 'supermarket',
        operating_hours: '9:00 AM - 9:30 PM',
        state: 'Johor',
        city: 'Batu Pahat',
        address: 'Jalan Tasek, 83000 Batu Pahat, Johor',
        location: { type: 'Point', coordinates: [102.9265, 1.8490] },
      },
    ]);
    console.log(`✅ ${stores.length} stores inserted (Batu Pahat, Johor)`);

    // Quick-access store references
    const S = {};
    stores.forEach(s => { S[s.storeName] = s; });

    // ════════════════════════════════════════════════════════════════
    // 2. CATEGORIES
    // ════════════════════════════════════════════════════════════════
    const categories = await Category.create([
      { categoryName: 'Rice & Grains' },
      { categoryName: 'Cooking Oil' },
      { categoryName: 'Sugar & Flour' },
      { categoryName: 'Beverages' },
      { categoryName: 'Dairy & Eggs' },
      { categoryName: 'Snacks & Biscuits' },
      { categoryName: 'Canned Food' },
      { categoryName: 'Noodles & Pasta' },
      { categoryName: 'Sauces & Condiments' },
      { categoryName: 'Personal Care' },
      { categoryName: 'Household' },
      { categoryName: 'Frozen Food' },
      { categoryName: 'Fruits & Vegetables' },
      { categoryName: 'Meat & Seafood' },
      { categoryName: 'Baby Products' },
      { categoryName: 'Bread & Bakery' },
    ]);
    const cat = (name) => categories.find(c => c.categoryName === name)._id;

    // ════════════════════════════════════════════════════════════════
    // 3. BRANDS — 35 real Malaysian brands
    // ════════════════════════════════════════════════════════════════
    const brands = await Brand.create([
      { brandName: 'Jasmine' },           // 0
      { brandName: 'Knife' },             // 1
      { brandName: 'CSR' },               // 2
      { brandName: 'Milo' },              // 3
      { brandName: 'Dutch Lady' },        // 4
      { brandName: 'Maggi' },             // 5
      { brandName: 'Adabi' },             // 6
      { brandName: "Munchy's" },          // 7
      { brandName: 'Ayam Brand' },        // 8
      { brandName: 'Cap Kipas Udang' },   // 9
      { brandName: 'Saji' },              // 10
      { brandName: 'Gardenia' },          // 11
      { brandName: 'Nestlé' },            // 12
      { brandName: 'F&N' },               // 13
      { brandName: 'Dettol' },            // 14
      { brandName: 'Dynamo' },            // 15
      { brandName: 'Kimball' },           // 16
      { brandName: "Yeo's" },             // 17
      { brandName: 'Vesawit' },           // 18
      { brandName: 'Goodday' },           // 19
      { brandName: 'Cintan' },            // 20
      { brandName: 'Colgate' },           // 21
      { brandName: 'Head & Shoulders' },  // 22
      { brandName: '100Plus' },           // 23
      { brandName: 'Clorox' },            // 24
      { brandName: "Julie's" },           // 25
      { brandName: 'Cap Rambutan' },      // 26
      { brandName: 'Gula Prai' },         // 27
      { brandName: 'Sunquick' },          // 28
      { brandName: 'Breeze' },            // 29
      { brandName: 'Farm Fresh' },        // 30
      { brandName: 'Mamee' },             // 31
      { brandName: 'Cap Sauh' },          // 32
      { brandName: 'Sunlight' },          // 33
      { brandName: 'Boh' },               // 34
    ]);
    const brand = (name) => brands.find(b => b.brandName === name)._id;

    // ════════════════════════════════════════════════════════════════
    // 4. PRODUCTS — 55 realistic Malaysian grocery items
    // ════════════════════════════════════════════════════════════════
    const products = await Product.create([
      // ── Rice & Grains (0–5) ──
      { barcode: 'D001', productName: 'Jasmine Super Special Local White Rice 5kg',     categoryId: cat('Rice & Grains'), brandId: brand('Jasmine'),       unit: 'bag',    status: 'active' },
      { barcode: 'D002', productName: 'Jasmine Super 5 Imported Rice 10kg',             categoryId: cat('Rice & Grains'), brandId: brand('Jasmine'),       unit: 'bag',    status: 'active' },
      { barcode: 'D003', productName: 'Cap Rambutan Beras Wangi 5kg',                   categoryId: cat('Rice & Grains'), brandId: brand('Cap Rambutan'),  unit: 'bag',    status: 'active' },
      { barcode: 'D004', productName: 'Jasmine Basmathi Rice 5kg',                      categoryId: cat('Rice & Grains'), brandId: brand('Jasmine'),       unit: 'bag',    status: 'active' },
      { barcode: 'D005', productName: 'Cap Rambutan Beras Perang 2kg',                  categoryId: cat('Rice & Grains'), brandId: brand('Cap Rambutan'),  unit: 'bag',    status: 'active' },
      { barcode: 'D006', productName: 'Jasmine Super Special 10kg',                     categoryId: cat('Rice & Grains'), brandId: brand('Jasmine'),       unit: 'bag',    status: 'active' },

      // ── Cooking Oil (6–9) ──
      { barcode: 'D007', productName: 'Knife Cooking Oil 5kg',                          categoryId: cat('Cooking Oil'),   brandId: brand('Knife'),         unit: 'bottle', status: 'active' },
      { barcode: 'D008', productName: 'Saji Cooking Oil 5kg',                           categoryId: cat('Cooking Oil'),   brandId: brand('Saji'),          unit: 'bottle', status: 'active' },
      { barcode: 'D009', productName: 'Vesawit Cooking Oil 5kg',                        categoryId: cat('Cooking Oil'),   brandId: brand('Vesawit'),       unit: 'bottle', status: 'active' },
      { barcode: 'D010', productName: 'Knife Cooking Oil 2kg',                          categoryId: cat('Cooking Oil'),   brandId: brand('Knife'),         unit: 'bottle', status: 'active' },

      // ── Sugar & Flour (10–13) ──
      { barcode: 'D011', productName: 'CSR Fine Grain Sugar 1kg',                       categoryId: cat('Sugar & Flour'), brandId: brand('CSR'),           unit: 'pack',   status: 'active' },
      { barcode: 'D012', productName: 'Gula Prai White Sugar 1kg',                      categoryId: cat('Sugar & Flour'), brandId: brand('Gula Prai'),     unit: 'pack',   status: 'active' },
      { barcode: 'D013', productName: 'Cap Kipas Udang Superfine Flour 1kg',            categoryId: cat('Sugar & Flour'), brandId: brand('Cap Kipas Udang'), unit: 'pack', status: 'active' },
      { barcode: 'D014', productName: 'CSR Gula Kastor 500g',                           categoryId: cat('Sugar & Flour'), brandId: brand('CSR'),           unit: 'pack',   status: 'active' },

      // ── Beverages (14–22) ──
      { barcode: 'D015', productName: 'Milo Activ-Go Powder 2kg',                       categoryId: cat('Beverages'),     brandId: brand('Milo'),          unit: 'pack',   status: 'active' },
      { barcode: 'D016', productName: 'Milo Activ-Go Powder 1kg',                       categoryId: cat('Beverages'),     brandId: brand('Milo'),          unit: 'pack',   status: 'active' },
      { barcode: 'D017', productName: 'Nestlé Nescafé Classic 200g',                    categoryId: cat('Beverages'),     brandId: brand('Nestlé'),        unit: 'bottle', status: 'active' },
      { barcode: 'D018', productName: "Yeo's Soy Milk 1L",                              categoryId: cat('Beverages'),     brandId: brand("Yeo's"),         unit: 'bottle', status: 'active' },
      { barcode: 'D019', productName: '100Plus Isotonic Drink 1.5L',                     categoryId: cat('Beverages'),     brandId: brand('100Plus'),       unit: 'bottle', status: 'active' },
      { barcode: 'D020', productName: 'Sunquick Orange Cordial 840ml',                   categoryId: cat('Beverages'),     brandId: brand('Sunquick'),      unit: 'bottle', status: 'active' },
      { barcode: 'D021', productName: 'F&N Sweetened Condensed Milk 500g',               categoryId: cat('Beverages'),     brandId: brand('F&N'),           unit: 'can',    status: 'active' },
      { barcode: 'D022', productName: 'Boh Cameron Highlands Tea 200g',                  categoryId: cat('Beverages'),     brandId: brand('Boh'),           unit: 'box',    status: 'active' },
      { barcode: 'D023', productName: 'Cap Sauh Barley Water 320ml (6-pack)',             categoryId: cat('Beverages'),     brandId: brand('Cap Sauh'),      unit: 'pack',   status: 'active' },

      // ── Dairy & Eggs (23–27) ──
      { barcode: 'D024', productName: 'Dutch Lady Full Cream Milk 1L',                   categoryId: cat('Dairy & Eggs'),  brandId: brand('Dutch Lady'),    unit: 'bottle', status: 'active' },
      { barcode: 'D025', productName: 'Dutch Lady Low Fat Milk 1L',                      categoryId: cat('Dairy & Eggs'),  brandId: brand('Dutch Lady'),    unit: 'bottle', status: 'active' },
      { barcode: 'D026', productName: 'Goodday Fresh Milk 1L',                           categoryId: cat('Dairy & Eggs'),  brandId: brand('Goodday'),       unit: 'bottle', status: 'active' },
      { barcode: 'D027', productName: 'Farm Fresh Pasteurised Fresh Milk 1L',            categoryId: cat('Dairy & Eggs'),  brandId: brand('Farm Fresh'),    unit: 'bottle', status: 'active' },
      { barcode: 'D028', productName: 'Dutch Lady Chocolate Milk 200ml (6-pack)',        categoryId: cat('Dairy & Eggs'),  brandId: brand('Dutch Lady'),    unit: 'pack',   status: 'active' },

      // ── Noodles & Pasta (28–33) ──
      { barcode: 'D029', productName: 'Maggi 2 Minute Noodles Curry (5x79g)',            categoryId: cat('Noodles & Pasta'), brandId: brand('Maggi'),       unit: 'pack',   status: 'active' },
      { barcode: 'D030', productName: 'Maggi 2 Minute Noodles Asam Laksa (5x78g)',       categoryId: cat('Noodles & Pasta'), brandId: brand('Maggi'),       unit: 'pack',   status: 'active' },
      { barcode: 'D031', productName: 'Maggi 2 Minute Tom Yam (5x80g)',                  categoryId: cat('Noodles & Pasta'), brandId: brand('Maggi'),       unit: 'pack',   status: 'active' },
      { barcode: 'D032', productName: 'Cintan Mi Sup (5x75g)',                           categoryId: cat('Noodles & Pasta'), brandId: brand('Cintan'),      unit: 'pack',   status: 'active' },
      { barcode: 'D033', productName: 'Maggi Mee Goreng (5x72g)',                        categoryId: cat('Noodles & Pasta'), brandId: brand('Maggi'),       unit: 'pack',   status: 'active' },
      { barcode: 'D034', productName: 'Mamee Chef Curry Laksa (4x75g)',                  categoryId: cat('Noodles & Pasta'), brandId: brand('Mamee'),       unit: 'pack',   status: 'active' },

      // ── Sauces & Condiments (34–38) ──
      { barcode: 'D035', productName: 'Adabi Serbuk Kari Daging 250g',                   categoryId: cat('Sauces & Condiments'), brandId: brand('Adabi'),  unit: 'pack',   status: 'active' },
      { barcode: 'D036', productName: 'Kimball Tomato Ketchup 500g',                     categoryId: cat('Sauces & Condiments'), brandId: brand('Kimball'), unit: 'bottle', status: 'active' },
      { barcode: 'D037', productName: 'Maggi Oyster Sauce 500g',                         categoryId: cat('Sauces & Condiments'), brandId: brand('Maggi'),   unit: 'bottle', status: 'active' },
      { barcode: 'D038', productName: 'Kimball Chilli Sauce 500g',                       categoryId: cat('Sauces & Condiments'), brandId: brand('Kimball'), unit: 'bottle', status: 'active' },
      { barcode: 'D039', productName: 'Adabi Serbuk Kunyit 250g',                        categoryId: cat('Sauces & Condiments'), brandId: brand('Adabi'),  unit: 'pack',   status: 'active' },

      // ── Snacks & Biscuits (39–42) ──
      { barcode: 'D040', productName: "Munchy's Cream Crackers 300g",                    categoryId: cat('Snacks & Biscuits'), brandId: brand("Munchy's"), unit: 'pack',   status: 'active' },
      { barcode: 'D041', productName: 'Nestlé Kit Kat 4F 35g (4-pack)',                  categoryId: cat('Snacks & Biscuits'), brandId: brand('Nestlé'),   unit: 'pack',   status: 'active' },
      { barcode: 'D042', productName: "Julie's Butter Crackers 250g",                    categoryId: cat('Snacks & Biscuits'), brandId: brand("Julie's"),  unit: 'pack',   status: 'active' },
      { barcode: 'D043', productName: 'Mamee Monster Noodle Snack BBQ (8x25g)',          categoryId: cat('Snacks & Biscuits'), brandId: brand('Mamee'),    unit: 'pack',   status: 'active' },

      // ── Canned Food (43–46) ──
      { barcode: 'D044', productName: 'Ayam Brand Sardines in Tomato Sauce 425g',        categoryId: cat('Canned Food'), brandId: brand('Ayam Brand'),     unit: 'can',    status: 'active' },
      { barcode: 'D045', productName: 'Ayam Brand Tuna Chunks in Water 185g',            categoryId: cat('Canned Food'), brandId: brand('Ayam Brand'),     unit: 'can',    status: 'active' },
      { barcode: 'D046', productName: 'Ayam Brand Baked Beans 425g',                     categoryId: cat('Canned Food'), brandId: brand('Ayam Brand'),     unit: 'can',    status: 'active' },
      { barcode: 'D047', productName: 'Adabi Sambal Ikan Bilis 160g',                    categoryId: cat('Canned Food'), brandId: brand('Adabi'),          unit: 'can',    status: 'active' },

      // ── Personal Care (47–49) ──
      { barcode: 'D048', productName: 'Dettol Antibacterial Shower Gel 950ml',           categoryId: cat('Personal Care'), brandId: brand('Dettol'),       unit: 'bottle', status: 'active' },
      { barcode: 'D049', productName: 'Head & Shoulders Anti-Dandruff Shampoo 330ml',   categoryId: cat('Personal Care'), brandId: brand('Head & Shoulders'), unit: 'bottle', status: 'active' },
      { barcode: 'D050', productName: 'Colgate Maximum Cavity Protection 250g',          categoryId: cat('Personal Care'), brandId: brand('Colgate'),      unit: 'unit',   status: 'active' },

      // ── Household (50–52) ──
      { barcode: 'D051', productName: 'Dynamo Liquid Detergent 2.7kg',                   categoryId: cat('Household'), brandId: brand('Dynamo'),           unit: 'bottle', status: 'active' },
      { barcode: 'D052', productName: 'Breeze Powder Detergent 2.5kg',                   categoryId: cat('Household'), brandId: brand('Breeze'),           unit: 'pack',   status: 'active' },
      { barcode: 'D053', productName: 'Sunlight Dishwashing Liquid 900ml',               categoryId: cat('Household'), brandId: brand('Sunlight'),         unit: 'bottle', status: 'active' },

      // ── Bread & Bakery (53–54) ──
      { barcode: 'D054', productName: 'Gardenia Original Classic White Bread 400g',      categoryId: cat('Bread & Bakery'), brandId: brand('Gardenia'),    unit: 'pack',   status: 'active' },
      { barcode: 'D055', productName: 'Gardenia Wholemeal Bread 400g',                   categoryId: cat('Bread & Bakery'), brandId: brand('Gardenia'),    unit: 'pack',   status: 'active' },
    ]);
    console.log(`✅ ${products.length} products inserted`);

    // ════════════════════════════════════════════════════════════════
    // 5. PRICES — Every product at every store with realistic RM variation
    //    Columns: [Lotus's, Econsave, Mydin, 99 Speedmart, KK Mart, Billion]
    // ════════════════════════════════════════════════════════════════
    const priceTable = [
      // Rice & Grains
      { i: 0,  p: [24.90, 23.90, 24.50, 25.50, 25.90, 24.20] },
      { i: 1,  p: [47.90, 45.90, 46.50, 49.90, 50.50, 46.80] },
      { i: 2,  p: [26.90, 26.50, 27.50, 28.20, 28.90, 27.20] },
      { i: 3,  p: [32.90, 32.50, 33.50, 34.90, 35.50, 33.20] },
      { i: 4,  p: [12.90, 12.50, 13.20, 13.90, 14.20, 13.00] },
      { i: 5,  p: [46.90, 44.90, 45.90, 48.90, 49.50, 46.00] },

      // Cooking Oil
      { i: 6,  p: [29.50, 28.90, 30.20, 31.50, 32.00, 29.80] },
      { i: 7,  p: [27.90, 27.50, 28.50, 29.50, 30.00, 28.20] },
      { i: 8,  p: [26.50, 25.90, 27.20, 28.00, 28.50, 26.80] },
      { i: 9,  p: [13.90, 13.50, 14.20, 14.90, 15.20, 13.80] },

      // Sugar & Flour
      { i: 10, p: [2.85,  2.80,  2.95,  3.10,  3.20,  2.90] },
      { i: 11, p: [2.80,  2.75,  2.90,  3.05,  3.15,  2.85] },
      { i: 12, p: [2.20,  2.15,  2.30,  2.45,  2.50,  2.25] },
      { i: 13, p: [3.50,  3.40,  3.70,  3.90,  3.99,  3.60] },

      // Beverages
      { i: 14, p: [28.90, 27.90, 29.90, 31.50, 32.90, 29.20] },
      { i: 15, p: [18.90, 17.90, 17.50, 19.90, 20.50, 18.50] },
      { i: 16, p: [18.90, 18.50, 19.50, 20.50, 21.00, 19.20] },
      { i: 17, p: [4.50,  4.30,  4.80,  4.99,  5.20,  4.60] },
      { i: 18, p: [3.50,  3.30,  3.70,  3.90,  3.99,  3.60] },
      { i: 19, p: [9.90,  9.50,  10.50, 10.90, 11.20, 9.80] },
      { i: 20, p: [4.80,  4.60,  5.00,  5.30,  5.50,  4.90] },
      { i: 21, p: [7.90,  7.50,  8.20,  8.50,  8.90,  7.80] },
      { i: 22, p: [8.50,  8.20,  8.90,  9.20,  9.50,  8.60] },

      // Dairy & Eggs
      { i: 23, p: [6.20,  5.99,  6.50,  6.80,  6.99,  6.30] },
      { i: 24, p: [6.50,  6.30,  6.80,  7.10,  7.30,  6.60] },
      { i: 25, p: [5.90,  5.70,  6.20,  6.50,  6.80,  6.00] },
      { i: 26, p: [7.90,  7.50,  7.80,  8.20,  8.50,  7.60] },
      { i: 27, p: [7.50,  7.20,  7.80,  8.20,  8.50,  7.60] },

      // Noodles & Pasta
      { i: 28, p: [5.20,  4.99,  5.50,  5.80,  5.99,  5.30] },
      { i: 29, p: [5.40,  5.20,  5.60,  5.90,  6.10,  5.50] },
      { i: 30, p: [5.30,  5.10,  5.50,  5.80,  5.99,  5.40] },
      { i: 31, p: [4.50,  4.30,  4.70,  4.99,  5.10,  4.60] },
      { i: 32, p: [5.50,  5.30,  5.80,  6.10,  6.30,  5.60] },
      { i: 33, p: [6.50,  6.20,  6.80,  7.10,  7.30,  6.60] },

      // Sauces & Condiments
      { i: 34, p: [4.50,  4.30,  4.80,  5.10,  5.30,  4.60] },
      { i: 35, p: [4.20,  3.99,  4.50,  4.80,  4.99,  4.30] },
      { i: 36, p: [6.80,  6.50,  7.10,  7.50,  7.80,  6.90] },
      { i: 37, p: [4.00,  3.80,  4.30,  4.50,  4.70,  4.10] },
      { i: 38, p: [3.90,  3.70,  4.10,  4.30,  4.50,  4.00] },

      // Snacks & Biscuits
      { i: 39, p: [4.80,  4.60,  5.10,  5.30,  5.50,  4.90] },
      { i: 40, p: [5.90,  5.70,  6.20,  6.50,  6.80,  6.00] },
      { i: 41, p: [5.50,  5.30,  5.80,  6.10,  6.30,  5.60] },
      { i: 42, p: [5.20,  4.90,  5.50,  5.80,  5.99,  5.30] },

      // Canned Food
      { i: 43, p: [7.90,  7.50,  8.20,  8.50,  8.80,  7.80] },
      { i: 44, p: [7.50,  7.20,  7.80,  8.20,  8.50,  7.60] },
      { i: 45, p: [4.20,  3.99,  4.50,  4.80,  4.99,  4.30] },
      { i: 46, p: [4.50,  4.20,  4.80,  5.10,  5.30,  4.60] },

      // Personal Care
      { i: 47, p: [19.90, 18.90, 20.50, 21.90, 22.50, 20.20] },
      { i: 48, p: [15.90, 15.50, 16.50, 17.50, 17.90, 16.20] },
      { i: 49, p: [8.50,  8.20,  8.90,  9.50,  9.90,  8.60] },

      // Household
      { i: 50, p: [25.90, 24.90, 26.50, 27.90, 28.50, 26.20] },
      { i: 51, p: [18.90, 18.50, 19.50, 20.50, 20.90, 19.20] },
      { i: 52, p: [5.90,  5.50,  6.20,  6.50,  6.80,  5.80] },

      // Bread & Bakery
      { i: 53, p: [3.20,  3.10,  3.30,  3.50,  3.60,  3.20] },
      { i: 54, p: [3.80,  3.70,  3.90,  4.10,  4.20,  3.80] },
    ];

    let priceCount = 0;
    for (const row of priceTable) {
      for (let si = 0; si < stores.length; si++) {
        const prevPrice = parseFloat((row.p[si] + (Math.random() * 1.5 + 0.2)).toFixed(2));
        await Price.create({
          productId: products[row.i]._id,
          storeId:   stores[si]._id,
          price:     row.p[si],
          previousPrice: prevPrice,
          inStock:   true,
        });
        priceCount++;
      }
    }
    console.log(`✅ ${priceCount} prices inserted (${products.length} products × ${stores.length} stores)`);

    // ════════════════════════════════════════════════════════════════
    // 6. PROMOTIONS — 5+ per major store, 25 total
    // ════════════════════════════════════════════════════════════════
    const now = new Date();
    const d = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const promos = await Promotion.create([
      // ── Lotus's (5 promos) ──
      { productId: products[14]._id, storeId: S["Lotus's"]._id, promotionTitle: "Milo Mega Sale",               promotionType: 'discount',  promotionPrice: 24.90, discountPercentage: 14, startDate: now, endDate: d(14) },
      { productId: products[28]._id, storeId: S["Lotus's"]._id, promotionTitle: "Buy 2 Free 1 Maggi Curry",     promotionType: 'buy1free1', promotionPrice: 4.50,  discountPercentage: 13, startDate: now, endDate: d(7) },
      { productId: products[23]._id, storeId: S["Lotus's"]._id, promotionTitle: "Fresh Milk Promo",             promotionType: 'discount',  promotionPrice: 5.49,  discountPercentage: 11, startDate: now, endDate: d(21) },
      { productId: products[39]._id, storeId: S["Lotus's"]._id, promotionTitle: "Snack Time Bundle",            promotionType: 'bundle',    promotionPrice: 3.99,  discountPercentage: 17, startDate: now, endDate: d(14) },
      { productId: products[53]._id, storeId: S["Lotus's"]._id, promotionTitle: "Gardenia Bread RM2.99",        promotionType: 'discount',  promotionPrice: 2.99,  discountPercentage: 7,  startDate: now, endDate: d(7) },

      // ── Econsave (5 promos) ──
      { productId: products[0]._id,  storeId: S["Econsave"]._id, promotionTitle: "Rice Bonanza — Jasmine 5kg",   promotionType: 'discount',  promotionPrice: 21.90, discountPercentage: 8,  startDate: now, endDate: d(14) },
      { productId: products[16]._id, storeId: S["Econsave"]._id, promotionTitle: "Coffee Lover Deal",            promotionType: 'discount',  promotionPrice: 16.90, discountPercentage: 9,  startDate: now, endDate: d(14) },
      { productId: products[10]._id, storeId: S["Econsave"]._id, promotionTitle: "Harga Rakyat — Gula CSR",      promotionType: 'discount',  promotionPrice: 2.59,  discountPercentage: 7,  startDate: now, endDate: d(14) },
      { productId: products[50]._id, storeId: S["Econsave"]._id, promotionTitle: "Household Clearance — Dynamo", promotionType: 'clearance', promotionPrice: 22.90, discountPercentage: 8,  startDate: now, endDate: d(7) },
      { productId: products[54]._id, storeId: S["Econsave"]._id, promotionTitle: "Buy 2 Free 1 Gardenia Bread",  promotionType: 'buy1free1', promotionPrice: 3.30,  discountPercentage: 11, startDate: now, endDate: d(7) },

      // ── Mydin (5 promos) ──
      { productId: products[6]._id,  storeId: S["Mydin"]._id, promotionTitle: "Murah Selalu — Cooking Oil",     promotionType: 'discount',  promotionPrice: 27.90, discountPercentage: 8,  startDate: now, endDate: d(7) },
      { productId: products[47]._id, storeId: S["Mydin"]._id, promotionTitle: "Dettol Flash Sale",              promotionType: 'discount',  promotionPrice: 16.90, discountPercentage: 18, startDate: now, endDate: d(7) },
      { productId: products[1]._id,  storeId: S["Mydin"]._id, promotionTitle: "Beras 10kg Murah — RM42.90",     promotionType: 'discount',  promotionPrice: 42.90, discountPercentage: 8,  startDate: now, endDate: d(14) },
      { productId: products[18]._id, storeId: S["Mydin"]._id, promotionTitle: "Sports Drink Promo — 100Plus",   promotionType: 'discount',  promotionPrice: 2.99,  discountPercentage: 19, startDate: now, endDate: d(7) },
      { productId: products[33]._id, storeId: S["Mydin"]._id, promotionTitle: "Mamee Laksa Bundle",             promotionType: 'bundle',    promotionPrice: 5.90,  discountPercentage: 13, startDate: now, endDate: d(14) },

      // ── 99 Speedmart (4 promos) ──
      { productId: products[15]._id, storeId: S["99 Speedmart"]._id, promotionTitle: "Milo 1kg Only RM17.90!",        promotionType: 'discount', promotionPrice: 17.90, discountPercentage: 10, startDate: now, endDate: d(7) },
      { productId: products[43]._id, storeId: S["99 Speedmart"]._id, promotionTitle: "Canned Food Fiesta — Sardines", promotionType: 'bundle',   promotionPrice: 6.90,  discountPercentage: 19, startDate: now, endDate: d(14) },
      { productId: products[26]._id, storeId: S["99 Speedmart"]._id, promotionTitle: "Farm Fresh Milk RM7.50",        promotionType: 'discount', promotionPrice: 7.50,  discountPercentage: 9,  startDate: now, endDate: d(7) },
      { productId: products[49]._id, storeId: S["99 Speedmart"]._id, promotionTitle: "Colgate RM7.99 Special",        promotionType: 'discount', promotionPrice: 7.99,  discountPercentage: 16, startDate: now, endDate: d(14) },

      // ── KK Mart (3 promos) ──
      { productId: products[23]._id, storeId: S["KK Super Mart"]._id, promotionTitle: "Dutch Lady Fresh Milk RM5.50",     promotionType: 'discount',  promotionPrice: 5.50, discountPercentage: 21, startDate: now, endDate: d(7) },
      { productId: products[48]._id, storeId: S["KK Super Mart"]._id, promotionTitle: "Hair Care Week — H&S Shampoo",    promotionType: 'buy1free1', promotionPrice: 13.90, discountPercentage: 22, startDate: now, endDate: d(7) },
      { productId: products[17]._id, storeId: S["KK Super Mart"]._id, promotionTitle: "Yeo's Soy Milk 2 for RM7.90",     promotionType: 'bundle',    promotionPrice: 3.95, discountPercentage: 24, startDate: now, endDate: d(14) },

      // ── Billion (3 promos) ──
      { productId: products[8]._id,  storeId: S["Billion"]._id, promotionTitle: "Vesawit Oil 5kg Harga Rendah",    promotionType: 'discount',  promotionPrice: 24.90, discountPercentage: 7,  startDate: now, endDate: d(14) },
      { productId: products[42]._id, storeId: S["Billion"]._id, promotionTitle: "Mamee Monster Snack RM4.50",      promotionType: 'discount',  promotionPrice: 4.50,  discountPercentage: 15, startDate: now, endDate: d(7) },
      { productId: products[51]._id, storeId: S["Billion"]._id, promotionTitle: "Breeze Detergent Jimat Pack",     promotionType: 'discount',  promotionPrice: 17.90, discountPercentage: 7,  startDate: now, endDate: d(14) },
    ]);
    console.log(`✅ ${promos.length} promotions inserted`);

    // ════════════════════════════════════════════════════════════════
    // 7. USERS — Admin + Demo User
    // ════════════════════════════════════════════════════════════════
    const admin = await User.create({
      fullName: 'Admin Demo',
      email: 'admin@groceryapp.com',
      password: 'Admin@1234',
      role: 'admin',
      phone: '+60127654321',
      address: 'Batu Pahat, Johor',
      preferredState: 'Johor',
      preferredStores: [S["Lotus's"]._id, S["Econsave"]._id, S["Mydin"]._id],
    });
    console.log('✅ Admin user created (admin@groceryapp.com / Admin@1234)');

    const demoUser = await User.create({
      fullName: 'Khalil Rahman',
      email: 'demo@groceryapp.com',
      password: 'Demo@1234',
      role: 'customer',
      phone: '+60121234567',
      address: 'Jalan Rahmat, Batu Pahat, Johor',
      preferredState: 'Johor',
      preferredStores: [S["Lotus's"]._id, S["Econsave"]._id, S["Mydin"]._id],
    });
    console.log('✅ Demo user created (demo@groceryapp.com / Demo@1234)');

    // ════════════════════════════════════════════════════════════════
    // 8. SHOPPING LIST — 10 items for demo user
    // ════════════════════════════════════════════════════════════════
    const shoppingList = await ShoppingList.create({
      userId: demoUser._id,
      title: 'Weekly Groceries',
      totalPrice: 98.40,
      estimatedSaving: 12.80,
    });

    await ShoppingListItem.create([
      { shoppingListId: shoppingList._id, productId: products[1]._id,  quantity: 1 },  // Rice 10kg
      { shoppingListId: shoppingList._id, productId: products[6]._id,  quantity: 1 },  // Cooking Oil
      { shoppingListId: shoppingList._id, productId: products[14]._id, quantity: 1 },  // Milo 2kg
      { shoppingListId: shoppingList._id, productId: products[23]._id, quantity: 2 },  // Fresh Milk
      { shoppingListId: shoppingList._id, productId: products[28]._id, quantity: 2 },  // Maggi Curry
      { shoppingListId: shoppingList._id, productId: products[53]._id, quantity: 2 },  // Gardenia Bread
      { shoppingListId: shoppingList._id, productId: products[10]._id, quantity: 1 },  // Sugar
      { shoppingListId: shoppingList._id, productId: products[43]._id, quantity: 2 },  // Sardines
      { shoppingListId: shoppingList._id, productId: products[47]._id, quantity: 1 },  // Dettol
      { shoppingListId: shoppingList._id, productId: products[52]._id, quantity: 1 },  // Dishwashing Liquid
    ]);
    console.log('✅ Demo shopping list created (10 items)');

    // ════════════════════════════════════════════════════════════════
    // 9. BUDGET — RM500 monthly, RM180 spent
    // ════════════════════════════════════════════════════════════════
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    await Budget.create({
      userId: demoUser._id,
      monthlyBudget: 500,
      spentAmount: 180,
      remainingAmount: 320,
      month: currentMonth,
      year: currentYear,
    });
    console.log('✅ Demo budget set (RM500 / RM180 spent / RM320 remaining)');

    // ════════════════════════════════════════════════════════════════
    // 10. SETTINGS
    // ════════════════════════════════════════════════════════════════
    await Settings.create({
      applicationName: 'BijakBeli',
      theme: 'light',
      maintenanceMode: false,
    });

    // ════════════════════════════════════════════════════════════════
    // SUMMARY
    // ════════════════════════════════════════════════════════════════
    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Demo seed complete — ready for presentation!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('  🔑 ADMIN LOGIN');
    console.log('     Email:    admin@groceryapp.com');
    console.log('     Password: Admin@1234');
    console.log('');
    console.log('  👤 DEMO USER LOGIN');
    console.log('     Email:    demo@groceryapp.com');
    console.log('     Password: Demo@1234');
    console.log('');
    console.log('  📊 DATA SUMMARY');
    console.log(`     🏪 ${stores.length} stores (Batu Pahat, Johor)`);
    console.log(`     🛒 ${products.length} products across 16 categories`);
    console.log(`     💰 ${priceCount} prices (every product at every store)`);
    console.log(`     🎉 ${promos.length} active promotions`);
    console.log(`     📝 1 shopping list (10 items)`);
    console.log(`     💵 Budget: RM500 / RM180 spent / RM320 remaining`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedDemo();

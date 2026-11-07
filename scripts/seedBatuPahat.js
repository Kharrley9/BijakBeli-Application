// Ensure we can find modules from the server directory
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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bijakbeli';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
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
    console.log('🗑️  Cleared existing data');

    // ============================================================
    // USERS
    // ============================================================
    const admin = await User.create({
      fullName: 'Admin BijakBeli',
      email: 'admin@bijakbeli.com',
      password: 'admin123',
      role: 'admin',
      phone: '+60127654321',
    });

    const customer = await User.create({
      fullName: 'Khalil Ahmad',
      email: 'khalil@example.com',
      password: 'password123',
      role: 'customer',
      phone: '+60121234567',
      address: 'Jalan Rahmat, Batu Pahat, Johor',
    });

    const customer2 = await User.create({
      fullName: 'Ahmad Razif',
      email: 'ahmad@example.com',
      password: 'customer123',
      role: 'customer',
      phone: '+60129876543',
      address: 'Taman Bukit Pasir, Batu Pahat, Johor',
    });
    console.log('👤 3 users created (1 admin, 2 customers)');

    // ============================================================
    // STORES — Real supermarkets in Batu Pahat, Johor
    // ============================================================
    const stores = await Store.create([
      {
        storeName: "Lotus's",
        mallName: "Lotus's Batu Pahat",
        branch: "Batu Pahat",
        type: "hypermarket",
        address: 'Lot 1, Jalan Kluang, 83000 Batu Pahat, Johor',
        operating_hours: '08:00 - 22:00',
        state: 'Johor',
        city: 'Batu Pahat',
        location: { type: 'Point', coordinates: [102.9358, 1.8548] },
        logo: '/assets/products/lotuss-batu-pahat/placeholder.png',
        isActive: true
      },
      {
        storeName: 'Mydin',
        mallName: 'Mydin Mall Batu Pahat',
        branch: "Batu Pahat",
        type: "hypermarket",
        address: 'Jalan Sultanah, 83000 Batu Pahat, Johor',
        operating_hours: '09:00 - 22:00',
        state: 'Johor',
        city: 'Batu Pahat',
        location: { type: 'Point', coordinates: [102.9378, 1.8503] },
        logo: '/assets/products/mydin-batu-pahat/placeholder.png',
        isActive: true
      },
      {
        storeName: 'Econsave',
        mallName: 'Econsave Batu Pahat',
        branch: "Batu Pahat",
        type: "supermarket",
        address: 'Jalan Bakau Condong, 83000 Batu Pahat, Johor',
        operating_hours: '08:00 - 22:00',
        state: 'Johor',
        city: 'Batu Pahat',
        location: { type: 'Point', coordinates: [102.9295, 1.8475] },
        logo: '/assets/products/econsave-batu-pahat/placeholder.png',
        isActive: true
      },
      {
        storeName: 'AEON BiG',
        mallName: 'AEON BiG Batu Pahat',
        branch: "Batu Pahat Square",
        type: "hypermarket",
        address: 'Jalan Kluang, 83000 Batu Pahat, Johor',
        operating_hours: '09:00 - 22:00',
        state: 'Johor',
        city: 'Batu Pahat',
        location: { type: 'Point', coordinates: [102.9325, 1.8548] },
        logo: '/assets/products/aeonbig-batu-pahat/placeholder.png',
        isActive: true
      },
      {
        storeName: 'Pacific Hypermarket',
        mallName: 'Batu Pahat Mall',
        branch: "Batu Pahat Mall",
        type: "hypermarket",
        address: 'Jalan Kluang, 83000 Batu Pahat, Johor',
        operating_hours: '10:00 - 22:00',
        state: 'Johor',
        city: 'Batu Pahat',
        location: { type: 'Point', coordinates: [102.9400, 1.8570] },
        logo: '/assets/products/pacific-batu-pahat/placeholder.png',
        isActive: true
      },
      {
        storeName: 'Target Supermarket',
        mallName: 'Summit Parade',
        branch: "Summit Parade",
        type: "supermarket",
        address: 'Jalan Bakau Condong, 83000 Batu Pahat, Johor',
        operating_hours: '10:00 - 21:30',
        state: 'Johor',
        city: 'Batu Pahat',
        location: { type: 'Point', coordinates: [102.9310, 1.8490] },
        logo: '/assets/products/target-batu-pahat/placeholder.png',
        isActive: true
      },
      {
        storeName: 'Super Cowboy',
        mallName: '',
        branch: "Jalan Kluang",
        type: "supermarket",
        address: 'Jalan Kluang, 83000 Batu Pahat, Johor',
        operating_hours: '09:00 - 22:00',
        state: 'Johor',
        city: 'Batu Pahat',
        location: { type: 'Point', coordinates: [102.9450, 1.8600] },
        logo: '/assets/products/supercowboy-batu-pahat/placeholder.png',
        isActive: true
      },
      {
        storeName: 'Nirwana Maju',
        mallName: '',
        branch: "Taman Flora Utama",
        type: "supermarket",
        address: 'Taman Flora Utama, 83000 Batu Pahat, Johor',
        operating_hours: '08:30 - 22:00',
        state: 'Johor',
        city: 'Batu Pahat',
        location: { type: 'Point', coordinates: [102.9380, 1.8560] },
        logo: '/assets/products/nirwana-batu-pahat/placeholder.png',
        isActive: true
      },
      {
        storeName: '99 Speedmart',
        mallName: '',
        branch: "Taman Bukit Pasir",
        type: "minimart",
        address: 'Taman Bukit Pasir, 83000 Batu Pahat, Johor',
        operating_hours: '10:00 - 22:00',
        state: 'Johor',
        city: 'Batu Pahat',
        location: { type: 'Point', coordinates: [102.9400, 1.8650] },
        logo: '/assets/products/99speedmart-batu-pahat/placeholder.png',
        isActive: true
      },
      {
        storeName: 'KK Super Mart',
        mallName: '',
        branch: "Taman Flora",
        type: "minimart",
        address: 'Taman Flora, 83000 Batu Pahat, Johor',
        operating_hours: '24 Hours',
        state: 'Johor',
        city: 'Batu Pahat',
        location: { type: 'Point', coordinates: [102.9370, 1.8580] },
        logo: '/assets/products/kkmart-batu-pahat/placeholder.png',
        isActive: true
      },
    ]);
    console.log(`🏪 ${stores.length} Batu Pahat stores created`);

    // ============================================================
    // CATEGORIES
    // ============================================================
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
    console.log('📁 16 categories created');

    // ============================================================
    // BRANDS
    // ============================================================
    const brands = await Brand.create([
      { brandName: 'Jasmine' },         // 0
      { brandName: 'Knife' },           // 1
      { brandName: 'CSR' },             // 2
      { brandName: 'Milo' },            // 3
      { brandName: 'Dutch Lady' },      // 4
      { brandName: 'Maggi' },           // 5
      { brandName: 'Adabi' },           // 6
      { brandName: "Munchy's" },        // 7
      { brandName: 'Ayam Brand' },      // 8
      { brandName: 'Cap Kipas Udang' }, // 9
      { brandName: 'Saji' },            // 10
      { brandName: 'Gardenia' },        // 11
      { brandName: 'Nestle' },          // 12
      { brandName: 'F&N' },             // 13
      { brandName: 'Dettol' },          // 14
      { brandName: 'Dynamo' },          // 15
      { brandName: 'Kimball' },         // 16
      { brandName: "Yeo's" },           // 17
      { brandName: 'Vesawit' },         // 18
      { brandName: 'Goodday' },         // 19
      { brandName: 'Cintan' },          // 20
      { brandName: 'Colgate' },         // 21
      { brandName: "Head & Shoulders" },// 22
      { brandName: '100Plus' },         // 23
      { brandName: 'Clorox' },          // 24
      { brandName: "Julie's" },         // 25
      { brandName: 'Cap Rambutan' },    // 26
      { brandName: 'Gula Prai' },       // 27
      { brandName: 'Sunquick' },        // 28
      { brandName: 'Breeze' },          // 29
    ]);
    console.log('🏷️  30 brands created');

    // Helpers
    const cat = (name) => categories.find((c) => c.categoryName === name)._id;
    const brand = (name) => brands.find((b) => b.brandName === name)._id;

    // ============================================================
    // PRODUCTS — 50 realistic Malaysian grocery items
    // ============================================================
    const products = await Product.create([
      // --- Rice & Grains (0-4) ---
      { barcode: '9555001', productName: 'Jasmine Super Special Local White Rice 5kg', description: 'Premium local white rice', categoryId: cat('Rice & Grains'), brandId: brand('Jasmine'), unit: 'bag', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555002', productName: 'Jasmine Super 5 Imported Rice 10kg', description: 'Imported fragrant rice 10kg bag', categoryId: cat('Rice & Grains'), brandId: brand('Jasmine'), unit: 'bag', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555003', productName: 'Cap Rambutan Beras Wangi 5kg', description: 'Premium fragrant rice from Thailand', categoryId: cat('Rice & Grains'), brandId: brand('Cap Rambutan'), unit: 'bag', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555004', productName: 'Jasmine Beras Super Special 10kg', description: 'Economy local white rice 10kg', categoryId: cat('Rice & Grains'), brandId: brand('Jasmine'), unit: 'bag', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555005', productName: 'Jasmine Basmathi Rice 5kg', description: 'Premium basmathi long grain rice', categoryId: cat('Rice & Grains'), brandId: brand('Jasmine'), unit: 'bag', status: 'active', image: '/assets/products/general/placeholder.png' },

      // --- Cooking Oil (5-8) ---
      { barcode: '9555006', productName: 'Knife Cooking Oil 5kg', description: 'Premium cooking oil for everyday use', categoryId: cat('Cooking Oil'), brandId: brand('Knife'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555007', productName: 'Saji Cooking Oil 5kg', description: 'Quality cooking oil', categoryId: cat('Cooking Oil'), brandId: brand('Saji'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555008', productName: 'Vesawit Cooking Oil 5kg', description: 'Palm cooking oil', categoryId: cat('Cooking Oil'), brandId: brand('Vesawit'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555009', productName: 'Knife Cooking Oil 2kg', description: 'Cooking oil smaller pack', categoryId: cat('Cooking Oil'), brandId: brand('Knife'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },

      // --- Sugar & Flour (9-12) ---
      { barcode: '9555010', productName: 'CSR Fine Grain Sugar 1kg', description: 'Fine grain white sugar', categoryId: cat('Sugar & Flour'), brandId: brand('CSR'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555011', productName: 'Gula Prai White Sugar 1kg', description: 'Refined white sugar', categoryId: cat('Sugar & Flour'), brandId: brand('Gula Prai'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555012', productName: 'Cap Kipas Udang Superfine Flour 1kg', description: 'All purpose flour', categoryId: cat('Sugar & Flour'), brandId: brand('Cap Kipas Udang'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555013', productName: 'CSR Gula Kastor 500g', description: 'Caster sugar for baking', categoryId: cat('Sugar & Flour'), brandId: brand('CSR'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },

      // --- Beverages (13-19) ---
      { barcode: '9555014', productName: 'Milo Activ-Go Powder 2kg', description: 'Chocolate malt drink', categoryId: cat('Beverages'), brandId: brand('Milo'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555015', productName: 'Milo Activ-Go Powder 1kg', description: 'Chocolate malt drink 1kg', categoryId: cat('Beverages'), brandId: brand('Milo'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555016', productName: 'Nestle Nescafe Classic 200g', description: 'Classic instant coffee', categoryId: cat('Beverages'), brandId: brand('Nestle'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555017', productName: "Yeo's Soy Milk 1L", description: 'Soy milk drink', categoryId: cat('Beverages'), brandId: brand("Yeo's"), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555018', productName: '100Plus Isotonic Drink 1.5L', description: 'Isotonic carbonated drink', categoryId: cat('Beverages'), brandId: brand('100Plus'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555019', productName: 'Sunquick Orange Cordial 840ml', description: 'Concentrated orange cordial', categoryId: cat('Beverages'), brandId: brand('Sunquick'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555020', productName: 'F&N Sweetened Condensed Milk 500g', description: 'Sweetened condensed milk', categoryId: cat('Dairy & Eggs'), brandId: brand('F&N'), unit: 'can', status: 'active', image: '/assets/products/general/placeholder.png' },

      // --- Dairy & Eggs (20-23) ---
      { barcode: '9555021', productName: 'Dutch Lady Pure Farm Full Cream Milk 1L', description: 'Full cream UHT milk', categoryId: cat('Dairy & Eggs'), brandId: brand('Dutch Lady'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555022', productName: 'Dutch Lady Pure Farm Low Fat Milk 1L', description: 'Low fat UHT milk', categoryId: cat('Dairy & Eggs'), brandId: brand('Dutch Lady'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555023', productName: 'Goodday Full Cream Milk 1L', description: 'Full cream milk', categoryId: cat('Dairy & Eggs'), brandId: brand('Goodday'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555024', productName: 'Dutch Lady Chocolate Milk 200ml (6-pack)', description: 'Chocolate flavoured milk', categoryId: cat('Dairy & Eggs'), brandId: brand('Dutch Lady'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },

      // --- Noodles & Pasta (24-28) ---
      { barcode: '9555025', productName: 'Maggi 2 Minute Noodles Curry (5x79g)', description: 'Instant curry noodles pack of 5', categoryId: cat('Noodles & Pasta'), brandId: brand('Maggi'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555026', productName: 'Maggi 2 Minute Noodles Asam Laksa (5x78g)', description: 'Instant asam laksa noodles pack of 5', categoryId: cat('Noodles & Pasta'), brandId: brand('Maggi'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555027', productName: 'Maggi 2 Minute Noodles Tom Yam (5x80g)', description: 'Instant tom yam noodles', categoryId: cat('Noodles & Pasta'), brandId: brand('Maggi'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555028', productName: 'Cintan Mi Sup (5x75g)', description: 'Instant soup noodles pack of 5', categoryId: cat('Noodles & Pasta'), brandId: brand('Cintan'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555029', productName: 'Maggi Maggi Mee Goreng (5x72g)', description: 'Instant fried noodles', categoryId: cat('Noodles & Pasta'), brandId: brand('Maggi'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },

      // --- Sauces & Condiments (29-33) ---
      { barcode: '9555030', productName: 'Adabi Curry Powder 250g', description: 'Traditional curry powder', categoryId: cat('Sauces & Condiments'), brandId: brand('Adabi'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555031', productName: 'Kimball Tomato Ketchup 500g', description: 'Tomato ketchup', categoryId: cat('Sauces & Condiments'), brandId: brand('Kimball'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555032', productName: 'Maggi Oyster Sauce 500g', description: 'Premium oyster sauce', categoryId: cat('Sauces & Condiments'), brandId: brand('Maggi'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555033', productName: 'Adabi Serbuk Kunyit 250g', description: 'Turmeric powder', categoryId: cat('Sauces & Condiments'), brandId: brand('Adabi'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555034', productName: 'Kimball Chilli Sauce 500g', description: 'Chilli sauce', categoryId: cat('Sauces & Condiments'), brandId: brand('Kimball'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },

      // --- Snacks & Biscuits (34-37) ---
      { barcode: '9555035', productName: "Munchy's Cream Crackers 300g", description: 'Classic cream crackers', categoryId: cat('Snacks & Biscuits'), brandId: brand("Munchy's"), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555036', productName: 'Nestle Kit Kat 4F 35g (4 pack)', description: 'Chocolate wafer biscuit', categoryId: cat('Snacks & Biscuits'), brandId: brand('Nestle'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555037', productName: "Julie's Butter Crackers 250g", description: 'Butter flavoured crackers', categoryId: cat('Snacks & Biscuits'), brandId: brand("Julie's"), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555038', productName: "Munchy's Lexus Cream Sandwich 190g", description: 'Cream sandwich biscuit', categoryId: cat('Snacks & Biscuits'), brandId: brand("Munchy's"), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },

      // --- Canned Food (38-41) ---
      { barcode: '9555039', productName: 'Ayam Brand Sardines in Tomato Sauce 425g', description: 'Sardines in tomato sauce', categoryId: cat('Canned Food'), brandId: brand('Ayam Brand'), unit: 'can', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555040', productName: 'Ayam Brand Tuna Chunks in Water 185g', description: 'Tuna chunks in water', categoryId: cat('Canned Food'), brandId: brand('Ayam Brand'), unit: 'can', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555041', productName: 'Adabi Sambal Ikan Bilis 160g', description: 'Anchovy sambal paste', categoryId: cat('Canned Food'), brandId: brand('Adabi'), unit: 'can', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555042', productName: 'Ayam Brand Baked Beans 425g', description: 'Baked beans in tomato sauce', categoryId: cat('Canned Food'), brandId: brand('Ayam Brand'), unit: 'can', status: 'active', image: '/assets/products/general/placeholder.png' },

      // --- Personal Care (42-44) ---
      { barcode: '9555043', productName: 'Dettol Antibacterial Shower Gel 950ml', description: 'Antibacterial body wash', categoryId: cat('Personal Care'), brandId: brand('Dettol'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555044', productName: 'Head & Shoulders Shampoo 330ml', description: 'Anti-dandruff shampoo', categoryId: cat('Personal Care'), brandId: brand('Head & Shoulders'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555045', productName: 'Colgate Maximum Cavity Protection 250g', description: 'Toothpaste with cavity protection', categoryId: cat('Personal Care'), brandId: brand('Colgate'), unit: 'unit', status: 'active', image: '/assets/products/general/placeholder.png' },

      // --- Household (45-47) ---
      { barcode: '9555046', productName: 'Dynamo Liquid Detergent 2.7kg', description: 'Concentrated liquid detergent', categoryId: cat('Household'), brandId: brand('Dynamo'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555047', productName: 'Breeze Powder Detergent 2.5kg', description: 'Powder detergent with colour care', categoryId: cat('Household'), brandId: brand('Breeze'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555048', productName: 'Clorox Bleach Original 1L', description: 'Multi-surface bleach cleaner', categoryId: cat('Household'), brandId: brand('Clorox'), unit: 'bottle', status: 'active', image: '/assets/products/general/placeholder.png' },

      // --- Bread & Bakery (48-49) ---
      { barcode: '9555049', productName: 'Gardenia Original Classic Bread 400g', description: 'Classic white bread', categoryId: cat('Bread & Bakery'), brandId: brand('Gardenia'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
      { barcode: '9555050', productName: 'Gardenia Wholemeal Bread 400g', description: 'Wholemeal bread', categoryId: cat('Bread & Bakery'), brandId: brand('Gardenia'), unit: 'pack', status: 'active', image: '/assets/products/general/placeholder.png' },
    ]);
    console.log('🛒 50 products created');

    // ============================================================
    // PRICES — Each product at each of the 5 stores
    // Prices in RM, with realistic small variations between stores
    // ============================================================
    const priceData = [
      // Rice & Grains
      { prod: 0, prices: [24.90, 24.50, 23.90, 25.20, 24.80] },  // Jasmine 5kg
      { prod: 1, prices: [47.90, 46.50, 45.90, 48.50, 47.50] },  // Jasmine 10kg
      { prod: 2, prices: [26.90, 27.50, 26.50, 27.80, 27.20] },  // Cap Rambutan 5kg
      { prod: 3, prices: [46.90, 45.90, 44.90, 47.50, 46.50] },  // Jasmine 10kg economy
      { prod: 4, prices: [32.90, 33.50, 32.50, 34.00, 33.20] },  // Basmathi 5kg

      // Cooking Oil
      { prod: 5, prices: [29.50, 30.20, 28.90, 30.50, 29.90] },  // Knife 5kg
      { prod: 6, prices: [27.90, 28.50, 27.50, 28.80, 28.20] },  // Saji 5kg
      { prod: 7, prices: [26.50, 27.20, 25.90, 27.50, 26.90] },  // Vesawit 5kg
      { prod: 8, prices: [13.90, 14.20, 13.50, 14.50, 13.80] },  // Knife 2kg

      // Sugar & Flour
      { prod: 9, prices: [2.85, 2.95, 2.80, 2.99, 2.90] },   // CSR Sugar
      { prod: 10, prices: [2.80, 2.90, 2.75, 2.95, 2.85] },   // Gula Prai
      { prod: 11, prices: [2.20, 2.30, 2.15, 2.35, 2.25] },   // Flour
      { prod: 12, prices: [3.50, 3.70, 3.40, 3.80, 3.60] },   // CSR Kastor

      // Beverages
      { prod: 13, prices: [28.90, 29.90, 27.90, 30.20, 29.50] }, // Milo 2kg
      { prod: 14, prices: [15.90, 16.50, 15.50, 16.80, 16.20] }, // Milo 1kg
      { prod: 15, prices: [18.90, 19.50, 18.50, 19.80, 19.20] }, // Nescafe
      { prod: 16, prices: [4.50, 4.80, 4.30, 4.90, 4.60] },     // Yeo's
      { prod: 17, prices: [3.50, 3.70, 3.30, 3.80, 3.60] },     // 100Plus
      { prod: 18, prices: [9.90, 10.50, 9.50, 10.80, 10.20] },  // Sunquick
      { prod: 19, prices: [4.80, 5.00, 4.60, 5.20, 4.90] },     // F&N Condensed

      // Dairy & Eggs
      { prod: 20, prices: [6.20, 6.50, 5.99, 6.60, 6.40] },     // Dutch Lady Full Cream
      { prod: 21, prices: [6.50, 6.80, 6.30, 6.90, 6.60] },     // Dutch Lady Low Fat
      { prod: 22, prices: [5.90, 6.20, 5.70, 6.30, 6.00] },     // Goodday
      { prod: 23, prices: [7.50, 7.80, 7.20, 8.00, 7.60] },     // Dutch Lady Choc 6pk

      // Noodles & Pasta
      { prod: 24, prices: [5.20, 5.50, 4.99, 5.60, 5.30] },     // Maggi Curry
      { prod: 25, prices: [5.40, 5.60, 5.20, 5.70, 5.50] },     // Maggi Asam Laksa
      { prod: 26, prices: [5.30, 5.50, 5.10, 5.60, 5.40] },     // Maggi Tom Yam
      { prod: 27, prices: [4.50, 4.70, 4.30, 4.80, 4.60] },     // Cintan
      { prod: 28, prices: [5.50, 5.80, 5.30, 5.90, 5.60] },     // Maggi Goreng

      // Sauces & Condiments
      { prod: 29, prices: [4.50, 4.80, 4.30, 4.90, 4.60] },     // Adabi Curry
      { prod: 30, prices: [4.20, 4.50, 3.99, 4.60, 4.30] },     // Kimball Ketchup
      { prod: 31, prices: [6.80, 7.10, 6.50, 7.20, 7.00] },     // Maggi Oyster
      { prod: 32, prices: [3.90, 4.10, 3.70, 4.20, 4.00] },     // Adabi Kunyit
      { prod: 33, prices: [4.00, 4.30, 3.80, 4.40, 4.10] },     // Kimball Chilli

      // Snacks & Biscuits
      { prod: 34, prices: [4.80, 5.10, 4.60, 5.20, 4.90] },     // Munchy's Crackers
      { prod: 35, prices: [5.90, 6.20, 5.70, 6.30, 6.00] },     // Kit Kat
      { prod: 36, prices: [5.50, 5.80, 5.30, 5.90, 5.60] },     // Julie's
      { prod: 37, prices: [3.50, 3.70, 3.30, 3.80, 3.60] },     // Munchy's Lexus

      // Canned Food
      { prod: 38, prices: [7.90, 8.20, 7.50, 8.30, 8.10] },     // Sardines
      { prod: 39, prices: [7.50, 7.80, 7.20, 7.90, 7.60] },     // Tuna
      { prod: 40, prices: [4.50, 4.80, 4.20, 4.90, 4.60] },     // Adabi Sambal
      { prod: 41, prices: [4.20, 4.50, 3.99, 4.60, 4.30] },     // Baked Beans

      // Personal Care
      { prod: 42, prices: [19.90, 20.50, 18.90, 20.80, 20.20] }, // Dettol
      { prod: 43, prices: [15.90, 16.50, 15.50, 16.80, 16.20] }, // H&S
      { prod: 44, prices: [8.50, 8.90, 8.20, 9.00, 8.70] },     // Colgate

      // Household
      { prod: 45, prices: [25.90, 26.50, 24.90, 26.80, 26.20] }, // Dynamo
      { prod: 46, prices: [18.90, 19.50, 18.50, 19.80, 19.20] }, // Breeze
      { prod: 47, prices: [6.90, 7.20, 6.50, 7.30, 7.00] },     // Clorox

      // Bread & Bakery
      { prod: 48, prices: [3.20, 3.30, 3.10, 3.40, 3.20] },     // Gardenia White
      { prod: 49, prices: [3.80, 3.90, 3.70, 4.00, 3.80] },     // Gardenia Wholemeal
    ];

    let priceCount = 0;
    for (const pd of priceData) {
      for (let i = 0; i < stores.length; i++) {
        // Use provided prices for first 5 stores, generate realistic prices for the rest based on the first price
        const basePrice = pd.prices[0];
        const storePrice = i < 5 ? pd.prices[i] : parseFloat((basePrice + (Math.random() * 2 - 1)).toFixed(2));
        
        await Price.create({
          productId: products[pd.prod]._id,
          storeId: stores[i]._id,
          price: storePrice,
          previousPrice: parseFloat((storePrice + (Math.random() * 2 - 0.5)).toFixed(2)),
        });
        priceCount++;
      }
    }
    console.log(`💰 ${priceCount} prices created (50 products × ${stores.length} stores)`);

    // ============================================================
    // PROMOTIONS — 15 active promotions
    // ============================================================
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const threeWeeksFromNow = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

    await Promotion.create([
      {
        productId: products[13]._id, // Milo 2kg
        storeId: stores[0]._id,      // Lotus's
        promotionTitle: 'Milo Mega Deal',
        promotionType: 'discount',
        promotionPrice: 24.90,
        discountPercentage: 14,
        startDate: now,
        endDate: twoWeeksFromNow,
      },
      {
        productId: products[5]._id, // Knife Oil 5kg
        storeId: stores[1]._id,     // Mydin
        promotionTitle: 'Murah Selalu - Cooking Oil',
        promotionType: 'discount',
        promotionPrice: 27.90,
        discountPercentage: 8,
        startDate: now,
        endDate: weekFromNow,
      },
      {
        productId: products[0]._id, // Jasmine Rice 5kg
        storeId: stores[2]._id,     // Econsave
        promotionTitle: 'Rice Bonanza',
        promotionType: 'discount',
        promotionPrice: 21.90,
        discountPercentage: 8,
        startDate: now,
        endDate: twoWeeksFromNow,
      },
      {
        productId: products[24]._id, // Maggi Curry
        storeId: stores[0]._id,      // Lotus's
        promotionTitle: 'Buy 2 Free 1 Maggi',
        promotionType: 'buy1free1',
        promotionPrice: 4.50,
        discountPercentage: 13,
        startDate: now,
        endDate: weekFromNow,
      },
      {
        productId: products[42]._id, // Dettol
        storeId: stores[1]._id,      // Mydin
        promotionTitle: 'Dettol Flash Sale',
        promotionType: 'discount',
        promotionPrice: 16.90,
        discountPercentage: 18,
        startDate: now,
        endDate: weekFromNow,
      },
      {
        productId: products[15]._id, // Nescafe
        storeId: stores[2]._id,      // Econsave
        promotionTitle: 'Coffee Lover Deal',
        promotionType: 'discount',
        promotionPrice: 16.90,
        discountPercentage: 12,
        startDate: now,
        endDate: twoWeeksFromNow,
      },
      {
        productId: products[38]._id, // Sardines
        storeId: stores[3]._id,      // TF Value-Mart
        promotionTitle: 'Canned Food Fiesta',
        promotionType: 'bundle',
        promotionPrice: 6.90,
        discountPercentage: 13,
        startDate: now,
        endDate: twoWeeksFromNow,
      },
      {
        productId: products[45]._id, // Dynamo
        storeId: stores[4]._id,      // AEON BiG
        promotionTitle: 'Household Clearance',
        promotionType: 'clearance',
        promotionPrice: 22.90,
        discountPercentage: 13,
        startDate: now,
        endDate: weekFromNow,
      },
      {
        productId: products[20]._id, // Dutch Lady Full Cream
        storeId: stores[0]._id,      // Lotus's
        promotionTitle: 'Fresh Milk Promo',
        promotionType: 'discount',
        promotionPrice: 5.49,
        discountPercentage: 11,
        startDate: now,
        endDate: threeWeeksFromNow,
      },
      {
        productId: products[48]._id, // Gardenia Bread
        storeId: stores[1]._id,      // Mydin
        promotionTitle: 'Daily Fresh Bread Deal',
        promotionType: 'discount',
        promotionPrice: 2.99,
        discountPercentage: 9,
        startDate: now,
        endDate: weekFromNow,
      },
      {
        productId: products[9]._id, // CSR Sugar
        storeId: stores[2]._id,     // Econsave
        promotionTitle: 'Harga Rakyat Sugar',
        promotionType: 'discount',
        promotionPrice: 2.59,
        discountPercentage: 7,
        startDate: now,
        endDate: twoWeeksFromNow,
      },
      {
        productId: products[1]._id, // Jasmine 10kg
        storeId: stores[3]._id,     // TF Value-Mart
        promotionTitle: 'Bulk Rice Special',
        promotionType: 'discount',
        promotionPrice: 43.90,
        discountPercentage: 9,
        startDate: now,
        endDate: twoWeeksFromNow,
      },
      {
        productId: products[43]._id, // Head & Shoulders
        storeId: stores[4]._id,      // AEON BiG
        promotionTitle: 'Hair Care Week',
        promotionType: 'buy1free1',
        promotionPrice: 13.90,
        discountPercentage: 14,
        startDate: now,
        endDate: weekFromNow,
      },
      {
        productId: products[34]._id, // Munchy's Crackers
        storeId: stores[0]._id,      // Lotus's
        promotionTitle: 'Snack Time Bundle',
        promotionType: 'bundle',
        promotionPrice: 3.99,
        discountPercentage: 17,
        startDate: now,
        endDate: twoWeeksFromNow,
      },
      {
        productId: products[17]._id, // 100Plus
        storeId: stores[1]._id,      // Mydin
        promotionTitle: 'Sports Drink Promo',
        promotionType: 'discount',
        promotionPrice: 2.99,
        discountPercentage: 19,
        startDate: now,
        endDate: weekFromNow,
      },
    ]);
    console.log('🎉 15 promotions created');

    // ============================================================
    // DEMO DATA — Shopping List & Budget for the demo customer
    // ============================================================
    const now2 = new Date();
    const currentMonth = now2.getMonth() + 1;
    const currentYear = now2.getFullYear();

    // Create a budget for the demo user
    await Budget.create({
      userId: customer._id,
      monthlyBudget: 300,
      spentAmount: 180,
      remainingAmount: 120,
      month: currentMonth,
      year: currentYear,
    });
    console.log('💵 Demo budget created for customer');

    // Create a demo shopping list
    const demoList = await ShoppingList.create({
      userId: customer._id,
      title: 'Weekly Groceries',
      totalPrice: 51.80,
      estimatedSaving: 3.20,
    });

    // Add items to the shopping list
    await ShoppingListItem.create([
      { shoppingListId: demoList._id, productId: products[1]._id, quantity: 1 },  // Rice 10kg
      { shoppingListId: demoList._id, productId: products[5]._id, quantity: 1 },  // Cooking Oil
      { shoppingListId: demoList._id, productId: products[20]._id, quantity: 2 }, // Milk
      { shoppingListId: demoList._id, productId: products[24]._id, quantity: 1 }, // Maggi Curry
    ]);
    console.log('🛍️  Demo shopping list created with 4 items');

    // Create settings
    await Settings.create({
      applicationName: 'BijakBeli',
      theme: 'light',
      maintenanceMode: false,
    });
    console.log('⚙️  Settings created');

    console.log('\n🌟 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Admin:    admin@bijakbeli.com / admin123');
    console.log('📧 Customer: khalil@example.com / password123');
    console.log('📧 Customer: ahmad@example.com / customer123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏪 ${stores.length} stores`);
    console.log(`🛒 ${products.length} products`);
    console.log(`💰 ${priceCount} prices`);
    console.log(`🎉 15 promotions`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();

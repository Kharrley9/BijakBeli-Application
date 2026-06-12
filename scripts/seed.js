const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

// Models
const User = require('../server/models/User');
const Store = require('../server/models/Store');
const Category = require('../server/models/Category');
const Brand = require('../server/models/Brand');
const Product = require('../server/models/Product');
const Price = require('../server/models/Price');
const Promotion = require('../server/models/Promotion');
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
      Settings.deleteMany(),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      fullName: 'Admin BijakBeli',
      email: 'admin@bijakbeli.com',
      password: 'admin123',
      role: 'admin',
      phone: '+60127654321',
    });
    console.log('👤 Admin user created');

    // Create demo customer
    const customer = await User.create({
      fullName: 'Ahmad Razif',
      email: 'ahmad@example.com',
      password: 'customer123',
      role: 'customer',
      phone: '+60121234567',
      address: 'Jalan Rahmat, Batu Pahat, Johor',
    });
    console.log('👤 Demo customer created');

    // Create stores
    const stores = await Store.create([
      {
        storeName: 'AEON Big',
        mallName: 'AEON Big Batu Pahat',
        address: 'Jalan Kluang, 83000 Batu Pahat, Johor',
        location: { type: 'Point', coordinates: [102.9325, 1.8548] },
      },
      {
        storeName: 'BP Mall',
        mallName: 'BP Mall Batu Pahat',
        address: 'Jalan Sultanah, 83000 Batu Pahat, Johor',
        location: { type: 'Point', coordinates: [102.9378, 1.8503] },
      },
      {
        storeName: 'Square One',
        mallName: 'Square One Mall Batu Pahat',
        address: 'Jalan Merdeka, 83000 Batu Pahat, Johor',
        location: { type: 'Point', coordinates: [102.9310, 1.8520] },
      },
    ]);
    console.log('🏪 3 stores created');

    // Create categories
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
    ]);
    console.log('📁 15 categories created');

    // Create brands
    const brands = await Brand.create([
      { brandName: 'Jasmine' },
      { brandName: 'Knife' },
      { brandName: 'CSR' },
      { brandName: 'Milo' },
      { brandName: 'Dutch Lady' },
      { brandName: 'Maggi' },
      { brandName: 'Adabi' },
      { brandName: 'Munchy\'s' },
      { brandName: 'Ayam Brand' },
      { brandName: 'Cap Kipas Udang' },
      { brandName: 'Saji' },
      { brandName: 'Gardenia' },
      { brandName: 'Nestle' },
      { brandName: 'F&N' },
      { brandName: 'Dettol' },
      { brandName: 'Dynamo' },
      { brandName: 'Kimball' },
      { brandName: 'Yeo\'s' },
    ]);
    console.log('🏷️  18 brands created');

    // Helper to find refs
    const cat = (name) => categories.find((c) => c.categoryName === name)._id;
    const brand = (name) => brands.find((b) => b.brandName === name)._id;

    // Create products
    const products = await Product.create([
      { barcode: '9555001', productName: 'Jasmine Super Special Local White Rice 5kg', description: 'Premium local white rice', categoryId: cat('Rice & Grains'), brandId: brand('Jasmine'), unit: 'bag', status: 'active' },
      { barcode: '9555002', productName: 'Jasmine Super 5 Imported Rice 5kg', description: 'Imported fragrant rice', categoryId: cat('Rice & Grains'), brandId: brand('Jasmine'), unit: 'bag', status: 'active' },
      { barcode: '9555003', productName: 'Knife Cooking Oil 5kg', description: 'Premium cooking oil for everyday use', categoryId: cat('Cooking Oil'), brandId: brand('Knife'), unit: 'bottle', status: 'active' },
      { barcode: '9555004', productName: 'Saji Cooking Oil 5kg', description: 'Quality cooking oil', categoryId: cat('Cooking Oil'), brandId: brand('Saji'), unit: 'bottle', status: 'active' },
      { barcode: '9555005', productName: 'CSR Fine Grain Sugar 1kg', description: 'Fine grain white sugar', categoryId: cat('Sugar & Flour'), brandId: brand('CSR'), unit: 'pack', status: 'active' },
      { barcode: '9555006', productName: 'Cap Kipas Udang Superfine Flour 1kg', description: 'All purpose flour', categoryId: cat('Sugar & Flour'), brandId: brand('Cap Kipas Udang'), unit: 'pack', status: 'active' },
      { barcode: '9555007', productName: 'Milo Activ-Go Powder 2kg', description: 'Chocolate malt drink', categoryId: cat('Beverages'), brandId: brand('Milo'), unit: 'pack', status: 'active' },
      { barcode: '9555008', productName: 'Milo Activ-Go Powder 1kg', description: 'Chocolate malt drink', categoryId: cat('Beverages'), brandId: brand('Milo'), unit: 'pack', status: 'active' },
      { barcode: '9555009', productName: 'Dutch Lady Pure Farm Full Cream Milk 1L', description: 'Full cream UHT milk', categoryId: cat('Dairy & Eggs'), brandId: brand('Dutch Lady'), unit: 'bottle', status: 'active' },
      { barcode: '9555010', productName: 'Dutch Lady Pure Farm Low Fat Milk 1L', description: 'Low fat UHT milk', categoryId: cat('Dairy & Eggs'), brandId: brand('Dutch Lady'), unit: 'bottle', status: 'active' },
      { barcode: '9555011', productName: 'Maggi 2 Minute Noodles Curry (5x79g)', description: 'Instant curry noodles pack of 5', categoryId: cat('Noodles & Pasta'), brandId: brand('Maggi'), unit: 'pack', status: 'active' },
      { barcode: '9555012', productName: 'Maggi 2 Minute Noodles Asam Laksa (5x78g)', description: 'Instant asam laksa noodles pack of 5', categoryId: cat('Noodles & Pasta'), brandId: brand('Maggi'), unit: 'pack', status: 'active' },
      { barcode: '9555013', productName: 'Adabi Curry Powder 250g', description: 'Traditional curry powder', categoryId: cat('Sauces & Condiments'), brandId: brand('Adabi'), unit: 'pack', status: 'active' },
      { barcode: '9555014', productName: 'Kimball Tomato Ketchup 500g', description: 'Tomato ketchup', categoryId: cat('Sauces & Condiments'), brandId: brand('Kimball'), unit: 'bottle', status: 'active' },
      { barcode: '9555015', productName: 'Munchy\'s Cream Crackers 300g', description: 'Classic cream crackers', categoryId: cat('Snacks & Biscuits'), brandId: brand('Munchy\'s'), unit: 'pack', status: 'active' },
      { barcode: '9555016', productName: 'Ayam Brand Sardines in Tomato Sauce 425g', description: 'Sardines in tomato sauce', categoryId: cat('Canned Food'), brandId: brand('Ayam Brand'), unit: 'can', status: 'active' },
      { barcode: '9555017', productName: 'Ayam Brand Tuna Chunks in Water 185g', description: 'Tuna chunks in water', categoryId: cat('Canned Food'), brandId: brand('Ayam Brand'), unit: 'can', status: 'active' },
      { barcode: '9555018', productName: 'Nestle Nescafe Classic 200g', description: 'Classic instant coffee', categoryId: cat('Beverages'), brandId: brand('Nestle'), unit: 'bottle', status: 'active' },
      { barcode: '9555019', productName: 'F&N Sweetened Condensed Milk 500g', description: 'Sweetened condensed milk', categoryId: cat('Dairy & Eggs'), brandId: brand('F&N'), unit: 'can', status: 'active' },
      { barcode: '9555020', productName: 'Yeo\'s Soy Milk 1L', description: 'Soy milk drink', categoryId: cat('Beverages'), brandId: brand('Yeo\'s'), unit: 'bottle', status: 'active' },
      { barcode: '9555021', productName: 'Dettol Antibacterial Shower Gel 950ml', description: 'Antibacterial body wash', categoryId: cat('Personal Care'), brandId: brand('Dettol'), unit: 'bottle', status: 'active' },
      { barcode: '9555022', productName: 'Dynamo Liquid Detergent 2.7kg', description: 'Concentrated liquid detergent', categoryId: cat('Household'), brandId: brand('Dynamo'), unit: 'bottle', status: 'active' },
      { barcode: '9555023', productName: 'Gardenia Original Classic Bread 400g', description: 'Classic white bread', categoryId: cat('Snacks & Biscuits'), brandId: brand('Gardenia'), unit: 'pack', status: 'active' },
      { barcode: '9555024', productName: 'Maggi Oyster Sauce 500g', description: 'Premium oyster sauce', categoryId: cat('Sauces & Condiments'), brandId: brand('Maggi'), unit: 'bottle', status: 'active' },
      { barcode: '9555025', productName: 'Nestle Kit Kat 4F 35g (4 pack)', description: 'Chocolate wafer biscuit', categoryId: cat('Snacks & Biscuits'), brandId: brand('Nestle'), unit: 'pack', status: 'active' },
    ]);
    console.log('🛒 25 products created');

    // Create prices for each product at each store
    const priceData = [
      // Rice 5kg
      { prod: 0, prices: [26.90, 27.50, 27.20] },
      { prod: 1, prices: [29.90, 30.50, 30.20] },
      // Cooking oil
      { prod: 2, prices: [29.50, 30.20, 29.90] },
      { prod: 3, prices: [27.90, 28.50, 28.20] },
      // Sugar & Flour
      { prod: 4, prices: [2.85, 2.95, 2.90] },
      { prod: 5, prices: [2.20, 2.30, 2.25] },
      // Beverages
      { prod: 6, prices: [28.90, 29.90, 29.50] },
      { prod: 7, prices: [15.90, 16.50, 16.20] },
      // Dairy
      { prod: 8, prices: [6.20, 6.50, 6.40] },
      { prod: 9, prices: [6.50, 6.80, 6.60] },
      // Noodles
      { prod: 10, prices: [5.20, 5.50, 5.30] },
      { prod: 11, prices: [5.40, 5.60, 5.50] },
      // Sauces
      { prod: 12, prices: [4.50, 4.80, 4.60] },
      { prod: 13, prices: [4.20, 4.50, 4.30] },
      // Snacks
      { prod: 14, prices: [4.80, 5.10, 4.90] },
      // Canned
      { prod: 15, prices: [7.90, 8.20, 8.10] },
      { prod: 16, prices: [7.50, 7.80, 7.60] },
      // More beverages
      { prod: 17, prices: [18.90, 19.50, 19.20] },
      { prod: 18, prices: [4.80, 5.00, 4.90] },
      { prod: 19, prices: [4.50, 4.80, 4.60] },
      // Personal care
      { prod: 20, prices: [19.90, 20.50, 20.20] },
      // Household
      { prod: 21, prices: [25.90, 26.50, 26.20] },
      // Bread
      { prod: 22, prices: [3.20, 3.30, 3.20] },
      // Sauce
      { prod: 23, prices: [6.80, 7.10, 7.00] },
      // Chocolate
      { prod: 24, prices: [5.90, 6.20, 6.00] },
    ];

    for (const pd of priceData) {
      for (let i = 0; i < 3; i++) {
        await Price.create({
          productId: products[pd.prod]._id,
          storeId: stores[i]._id,
          price: pd.prices[i],
          previousPrice: pd.prices[i] + (Math.random() * 2 - 0.5),
        });
      }
    }
    console.log('💰 75 prices created (25 products × 3 stores)');

    // Create promotions
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    await Promotion.create([
      {
        productId: products[6]._id, // Milo 2kg
        storeId: stores[0]._id, // AEON Big
        promotionTitle: 'Milo Mega Deal',
        promotionType: 'discount',
        promotionPrice: 24.90,
        discountPercentage: 14,
        startDate: now,
        endDate: twoWeeksFromNow,
      },
      {
        productId: products[2]._id, // Knife Oil
        storeId: stores[1]._id, // BP Mall
        promotionTitle: 'Cooking Oil Weekly Special',
        promotionType: 'discount',
        promotionPrice: 27.90,
        discountPercentage: 8,
        startDate: now,
        endDate: weekFromNow,
      },
      {
        productId: products[0]._id, // Rice
        storeId: stores[2]._id, // Square One
        promotionTitle: 'Rice Bonanza',
        promotionType: 'discount',
        promotionPrice: 24.90,
        discountPercentage: 8,
        startDate: now,
        endDate: twoWeeksFromNow,
      },
      {
        productId: products[10]._id, // Maggi Curry
        storeId: stores[0]._id,
        promotionTitle: 'Buy 2 Free 1 Maggi',
        promotionType: 'buy1free1',
        promotionPrice: 4.50,
        discountPercentage: 13,
        startDate: now,
        endDate: weekFromNow,
      },
      {
        productId: products[20]._id, // Dettol
        storeId: stores[1]._id,
        promotionTitle: 'Dettol Flash Sale',
        promotionType: 'discount',
        promotionPrice: 16.90,
        discountPercentage: 18,
        startDate: now,
        endDate: weekFromNow,
      },
      {
        productId: products[17]._id, // Nescafe
        storeId: stores[2]._id,
        promotionTitle: 'Coffee Lover Deal',
        promotionType: 'discount',
        promotionPrice: 16.90,
        discountPercentage: 12,
        startDate: now,
        endDate: twoWeeksFromNow,
      },
      {
        productId: products[15]._id, // Sardines
        storeId: stores[0]._id,
        promotionTitle: 'Canned Food Fiesta',
        promotionType: 'bundle',
        promotionPrice: 6.90,
        discountPercentage: 13,
        startDate: now,
        endDate: twoWeeksFromNow,
      },
      {
        productId: products[21]._id, // Dynamo
        storeId: stores[2]._id,
        promotionTitle: 'Household Clearance',
        promotionType: 'clearance',
        promotionPrice: 22.90,
        discountPercentage: 13,
        startDate: now,
        endDate: weekFromNow,
      },
    ]);
    console.log('🎉 8 promotions created');

    // Create settings
    await Settings.create({
      applicationName: 'BijakBeli',
      theme: 'light',
      maintenanceMode: false,
    });
    console.log('⚙️  Settings created');

    console.log('\n🌟 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Admin: admin@bijakbeli.com / admin123');
    console.log('📧 Customer: ahmad@example.com / customer123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();

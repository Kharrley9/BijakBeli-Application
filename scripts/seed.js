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

  // One representative photo per category (Unsplash, direct CDN links) — every
  // product in a category shares its picture since we don't have per-SKU photography.
  const CATEGORY_IMAGES = {
    'Rice & Grains': '1586201375761-83865001e31c',
    'Cooking Oil': '1757801333069-f7b3cabaec4a',
    'Sugar & Flour': '1634612831148-03a8550e1d52',
    Beverages: '1562115260-42521bf8b1a4',
    'Dairy & Eggs': '1552593050-477020c5af3f',
    'Snacks & Biscuits': '1464195085758-89f3e55e821e',
    'Canned Food': '1738618140037-09e11c8e644a',
    'Noodles & Pasta': '1570715586318-640b87430b16',
    'Sauces & Condiments': '1608736427500-c547edecc2b1',
    'Personal Care': '1701992678972-d5a053ad0fb0',
    Household: '1550963295-019d8a8a61c5',
    'Bread & Bakery': '1709904749558-d943f5005b48',
    'Fruits & Vegetables': '1757627550652-30788bfce978',
    'Meat & Seafood': '1682991136736-a2b44623eeba',
  };
  const categoryImage = (category) =>
    `https://images.unsplash.com/photo-${CATEGORY_IMAGES[category]}?w=400&h=400&fit=crop&q=80&auto=format`;

  // Per-product-type photos (Unsplash photo id, or a full Pexels CDN URL prefixed
  // 'PEXELS:') — sourced only from free stock-photo sites, never the chains' own
  // sites (several disallow AI crawling in robots.txt). Falls back to categoryImage()
  // for the handful of types with no good free match (see PRODUCT_IMAGES gaps below).
  const PRODUCT_IMAGES = {
    riceWhite: '1644377949116-c4a6b529241c',
    riceBrown: '1593357849627-cbbc9fda6b05',
    riceGlutinous: '1704916029292-ec7b5976204c',
    cookingOil: '1611608927037-4e8da6aa170e',
    sugar: '1634612831148-03a8550e1d52',
    flour: '1699315529894-402495fddb8b',
    whiteBreadLoaf: '1598373182133-52452f7691ef',
    wholemealBreadLoaf: '1626423642268-24cc183cbacb',
    chocolateMaltPowder: 'PEXELS:https://images.pexels.com/photos/25440429/pexels-photo-25440429.jpeg?w=400&h=400&fit=crop&auto=format',
    instantCoffeeJar: '1706076876153-9ebbe8f20738',
    soyMilk: '1583507623011-5cc6ff99e11c',
    isotonicDrink: '1554415955-3e13eb195c5f',
    cordialSyrup: 'PEXELS:https://images.pexels.com/photos/37368255/pexels-photo-37368255.jpeg?w=400&h=400&fit=crop&auto=format',
    sodaBottle: '1562115260-42521bf8b1a4',
    blackcurrantDrink: 'PEXELS:https://images.pexels.com/photos/5945669/pexels-photo-5945669.jpeg?w=400&h=400&fit=crop&auto=format',
    orangeJuice: '1650547002676-7cd5dea3175e',
    culturedMilkDrink: '1758960605961-353a4e0958fa',
    herbalTea: 'PEXELS:https://images.pexels.com/photos/11030248/pexels-photo-11030248.jpeg?w=400&h=400&fit=crop&auto=format',
    coffeeSachets: 'PEXELS:https://images.pexels.com/photos/15812210/pexels-photo-15812210.jpeg?w=400&h=400&fit=crop&auto=format',
    condensedMilk: '1788522631524-6e0308e39862',
    milkCarton: '1601436423474-51738541c1b1',
    eggs: '1660224286794-fc173fa9295c',
    butter: 'PEXELS:https://images.pexels.com/photos/8188934/pexels-photo-8188934.jpeg?w=400&h=400&fit=crop&q=80&auto=format',
    creamCrackers: '1690983318341-598b223c6560',
    chocolateBar: '1577735543554-b77ab63447bb',
    butterCrackers: '1636986196800-501029e4758d',
    creamSandwichBiscuit: '1563221653-990de148f14a',
    potatoChips: '1741520149946-d2e652514b5a',
    cornSnack: '1776178393300-48bc87f3b65b',
    sandwichCookie: 'PEXELS:https://images.pexels.com/photos/14283899/pexels-photo-14283899.jpeg?w=400&h=400&fit=crop&q=80&auto=format',
    layerCake: '1772469425825-b1b5309760d4',
    cannedSardines: 'PEXELS:https://images.pexels.com/photos/13499754/pexels-photo-13499754.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    cannedTuna: 'PEXELS:https://images.pexels.com/photos/12001951/pexels-photo-12001951.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    cannedBakedBeans: '1591436733320-f4c76aaf9546',
    cannedCornedBeef: 'PEXELS:https://images.pexels.com/photos/5606546/pexels-photo-5606546.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    instantNoodlesPack: 'PEXELS:https://images.pexels.com/photos/23014601/pexels-photo-23014601.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    whiteCurryNoodles: '1491961865842-98f7befd1a60',
    curryPowder: 'PEXELS:https://images.pexels.com/photos/5213945/pexels-photo-5213945.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    ketchupBottle: '1569790554690-1c0877b2fc6c',
    turmericPowder: 'PEXELS:https://images.pexels.com/photos/8760466/pexels-photo-8760466.png?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    chilliSauce: '1757800499190-9927c5806d36',
    soySauce: 'PEXELS:https://images.pexels.com/photos/19730266/pexels-photo-19730266.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    stockCubes: 'PEXELS:https://images.pexels.com/photos/4197982/pexels-photo-4197982.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    showerGel: '1673847401550-fd92f05614b9',
    shampoo: '1701992678972-d5a053ad0fb0',
    toothpaste: '1711779187508-a8fac1c18be9',
    deodorant: '1737987129570-d4a798a8e87b',
    bodyLotion: '1632841176116-68bdbd539917',
    antisepticLiquid: 'PEXELS:https://images.pexels.com/photos/4072041/pexels-photo-4072041.jpeg?w=400&h=400&fit=crop&auto=compress',
    liquidDetergent: 'PEXELS:https://images.pexels.com/photos/10566506/pexels-photo-10566506.jpeg?w=400&h=400&fit=crop&auto=compress',
    powderDetergent: 'PEXELS:https://images.pexels.com/photos/13768941/pexels-photo-13768941.jpeg?w=400&h=400&fit=crop&auto=compress',
    bleach: '1584813470613-5b1c1cad3d69',
    dishwashingLiquid: '1647577746559-c9a28c0d0870',
    airFreshenerSpray: '1572635196243-4dd75fbdbd7f',
    mosquitoCoil: 'PEXELS:https://images.pexels.com/photos/35523936/pexels-photo-35523936.jpeg?w=400&h=400&fit=crop&auto=compress',
    bathroomCleaner: '1587937533577-0ba337fbd436',
    cabbage: '1693500383228-dd0bdc78eba6',
    carrot: '1445282768818-728615cc910a',
    banana: '1662150681339-867e940ea30d',
    tomato: '1587411768515-eeac0647deed',
    lettuce: '1640958904159-51ae08bd3412',
    cucumber: '1449300079323-02e209d9d3a6',
    longBean: 'PEXELS:https://images.pexels.com/photos/18040977/pexels-photo-18040977.jpeg?w=400&h=400&fit=crop&auto=compress',
    apple: '1661193302094-40573e6786c6',
    watermelon: '1630081015918-8a21078e5cee',
    sweetPotato: '1570723735746-c9bd51bd7c40',
    wholeChicken: '1672787153720-e85fe802fd9f',
    chickenBreast: '1633096013004-e2cb4023b560',
    tilapiaFish: 'PEXELS:https://images.pexels.com/photos/8352786/pexels-photo-8352786.jpeg?w=400&h=400&fit=crop&auto=compress',
    prawns: '1548587468-971ebe4c8c3b',
    mackerel: '1554071407-1fb7259a9118',
    // No good free-stock match found for these — fall back to the category photo:
    // gulaMelaka, chocolateMilk, evaporatedMilk, cannedSambal, cannedMushroom,
    // cannedCoconutMilk, oysterSauce, beef, chickenWings.
  };
  const productImage = (typeKey, category) => {
    const id = PRODUCT_IMAGES[typeKey];
    if (!id) return categoryImage(category);
    if (id.startsWith('PEXELS:')) return id.slice('PEXELS:'.length);
    return `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&q=80&auto=format`;
  };

  // ---- BRANDS ----
  const brandNames = [
    'Jasmine', 'Knife', 'CSR', 'Milo', 'Dutch Lady', 'Maggi', 'Adabi', "Munchy's", 'Ayam Brand',
    'Cap Kipas Udang', 'Saji', 'Gardenia', 'Nestle', 'F&N', 'Dettol', 'Dynamo', 'Kimball', "Yeo's",
    'Vesawit', 'Goodday', 'Cintan', 'Colgate', 'Head & Shoulders', '100Plus', 'Clorox', "Julie's",
    'Cap Rambutan', 'Gula Prai', 'Sunquick', 'Breeze',
    // expanded catalogue
    'Faiza', 'Herba', 'Sri Ganti', 'Jati', 'Segi Enam', 'Buruh', 'Naturub', 'Seri Pelangi',
    'Prima', 'FFM', 'Ribena', 'Marigold', 'Vitagen', 'Season', 'Farm Fresh', 'Anchor',
    'Hup Seng', "Jacob's", 'Mister Potato', 'Twisties', 'Oreo', 'Apollo', 'Marina', 'Massimo',
    'Narcissus', 'MyKuali', 'Ibumie', 'Mi Sedaap', 'Koka', 'Doll', "Lingham's", 'Life',
    'Sunsilk', 'Rexona', 'Nivea', 'Darlie', 'Zam-Zam', 'Vim', 'Glade', 'Ridsect', 'Mr Muscle',
    'Kao Attack', 'High5',
  ];
  const brands = await Brand.insertMany(brandNames.map((brandName) => ({ brandName })));
  const brand = (n) => brands.find((b) => b.brandName === n)._id;
  console.log(`🏷️  ${brands.length} brands`);

  // ---- GROCERY CATALOGUE ----
  // Hand-compiled from general knowledge of real Malaysian grocery brands/SKUs and
  // typical retail pricing — NOT scraped from any retailer's site (several explicitly
  // disallow AI crawling in robots.txt, which we respect). Sample data, edit via admin.
  const grocery = [
    // Rice & Grains
    ['Jasmine Super Special Local White Rice 5kg', 'Rice & Grains', 'Jasmine', 'bag', 24.9, 'riceWhite'],
    ['Jasmine Super 5 Imported Rice 10kg', 'Rice & Grains', 'Jasmine', 'bag', 47.9, 'riceWhite'],
    ['Cap Rambutan Beras Wangi 5kg', 'Rice & Grains', 'Cap Rambutan', 'bag', 26.9, 'riceWhite'],
    ['Jasmine Beras Super Special 10kg', 'Rice & Grains', 'Jasmine', 'bag', 46.9, 'riceWhite'],
    ['Jasmine Basmathi Rice 5kg', 'Rice & Grains', 'Jasmine', 'bag', 32.9, 'riceWhite'],
    ['Faiza Beras Super Tempatan 10kg', 'Rice & Grains', 'Faiza', 'bag', 45.9, 'riceWhite'],
    ['Herba Ponni Rice 5kg', 'Rice & Grains', 'Herba', 'bag', 22.9, 'riceWhite'],
    ['Sri Ganti Beras Wangi Import 5kg', 'Rice & Grains', 'Sri Ganti', 'bag', 27.9, 'riceWhite'],
    ['Jati Beras Super Tempatan 5kg', 'Rice & Grains', 'Jati', 'bag', 23.9, 'riceWhite'],
    ['Segi Enam Beras Tempatan 10kg', 'Rice & Grains', 'Segi Enam', 'bag', 42.9, 'riceWhite'],
    ['Faiza Brown Rice 2kg', 'Rice & Grains', 'Faiza', 'bag', 14.9, 'riceBrown'],
    ['Jasmine Glutinous Rice (Pulut) 1kg', 'Rice & Grains', 'Jasmine', 'pack', 8.9, 'riceGlutinous'],
    // Cooking Oil
    ['Knife Cooking Oil 5kg', 'Cooking Oil', 'Knife', 'bottle', 29.5, 'cookingOil'],
    ['Saji Cooking Oil 5kg', 'Cooking Oil', 'Saji', 'bottle', 27.9, 'cookingOil'],
    ['Vesawit Cooking Oil 5kg', 'Cooking Oil', 'Vesawit', 'bottle', 26.5, 'cookingOil'],
    ['Knife Cooking Oil 2kg', 'Cooking Oil', 'Knife', 'bottle', 13.9, 'cookingOil'],
    ['Buruh Cooking Oil 5kg', 'Cooking Oil', 'Buruh', 'bottle', 26.9, 'cookingOil'],
    ['Naturub Cooking Oil 5kg', 'Cooking Oil', 'Naturub', 'bottle', 25.9, 'cookingOil'],
    ['Seri Pelangi Cooking Oil 3kg', 'Cooking Oil', 'Seri Pelangi', 'bottle', 16.9, 'cookingOil'],
    ['Saji Cooking Oil 1kg', 'Cooking Oil', 'Saji', 'bottle', 6.5, 'cookingOil'],
    // Sugar & Flour
    ['CSR Fine Grain Sugar 1kg', 'Sugar & Flour', 'CSR', 'pack', 2.85, 'sugar'],
    ['Gula Prai White Sugar 1kg', 'Sugar & Flour', 'Gula Prai', 'pack', 2.8, 'sugar'],
    ['Cap Kipas Udang Superfine Flour 1kg', 'Sugar & Flour', 'Cap Kipas Udang', 'pack', 2.2, 'flour'],
    ['CSR Gula Kastor 500g', 'Sugar & Flour', 'CSR', 'pack', 3.5, 'sugar'],
    ['Prima Plain Flour 1kg', 'Sugar & Flour', 'Prima', 'pack', 2.5, 'flour'],
    ['FFM Self Raising Flour 1kg', 'Sugar & Flour', 'FFM', 'pack', 2.9, 'flour'],
    ['Gula Melaka (Palm Sugar) 500g', 'Sugar & Flour', null, 'pack', 6.9, 'gulaMelaka'],
    // Beverages
    ['Milo Activ-Go Powder 2kg', 'Beverages', 'Milo', 'pack', 28.9, 'chocolateMaltPowder'],
    ['Milo Activ-Go Powder 1kg', 'Beverages', 'Milo', 'pack', 15.9, 'chocolateMaltPowder'],
    ['Nestle Nescafe Classic 200g', 'Beverages', 'Nestle', 'bottle', 18.9, 'instantCoffeeJar'],
    ["Yeo's Soy Milk 1L", 'Beverages', "Yeo's", 'bottle', 4.5, 'soyMilk'],
    ['100Plus Isotonic Drink 1.5L', 'Beverages', '100Plus', 'bottle', 3.5, 'isotonicDrink'],
    ['Sunquick Orange Cordial 840ml', 'Beverages', 'Sunquick', 'bottle', 9.9, 'cordialSyrup'],
    ['F&N Sarsi 1.5L', 'Beverages', 'F&N', 'bottle', 3.9, 'sodaBottle'],
    ['Ribena Blackcurrant 1L', 'Beverages', 'Ribena', 'bottle', 12.9, 'blackcurrantDrink'],
    ['Marigold Peel Fresh Orange Juice 1L', 'Beverages', 'Marigold', 'bottle', 8.5, 'orangeJuice'],
    ['Vitagen Cultured Milk 6x125ml', 'Beverages', 'Vitagen', 'pack', 6.9, 'culturedMilkDrink'],
    ['Season Chrysanthemum Tea 500ml', 'Beverages', 'Season', 'bottle', 2.5, 'herbalTea'],
    ['Nescafe 3in1 Original 15x20g', 'Beverages', 'Nestle', 'pack', 10.9, 'coffeeSachets'],
    // Dairy & Eggs
    ['F&N Sweetened Condensed Milk 500g', 'Dairy & Eggs', 'F&N', 'can', 4.8, 'condensedMilk'],
    ['Dutch Lady Pure Farm Full Cream Milk 1L', 'Dairy & Eggs', 'Dutch Lady', 'bottle', 6.2, 'milkCarton'],
    ['Dutch Lady Pure Farm Low Fat Milk 1L', 'Dairy & Eggs', 'Dutch Lady', 'bottle', 6.5, 'milkCarton'],
    ['Goodday Full Cream Milk 1L', 'Dairy & Eggs', 'Goodday', 'bottle', 5.9, 'milkCarton'],
    ['Dutch Lady Chocolate Milk 200ml (6-pack)', 'Dairy & Eggs', 'Dutch Lady', 'pack', 7.5, 'chocolateMilk'],
    ['Grade A Chicken Eggs (30s)', 'Dairy & Eggs', null, 'tray', 13.5, 'eggs'],
    ['Farm Fresh Fresh Milk 1L', 'Dairy & Eggs', 'Farm Fresh', 'bottle', 7.9, 'milkCarton'],
    ['Marigold HL Milk 1L', 'Dairy & Eggs', 'Marigold', 'bottle', 6.8, 'milkCarton'],
    ['Nestle Carnation Evaporated Milk 390g', 'Dairy & Eggs', 'Nestle', 'can', 3.5, 'evaporatedMilk'],
    ['Anchor Butter 227g', 'Dairy & Eggs', 'Anchor', 'pack', 9.9, 'butter'],
    ['Grade B Chicken Eggs (30s)', 'Dairy & Eggs', null, 'tray', 12.5, 'eggs'],
    // Snacks & Biscuits
    ["Munchy's Cream Crackers 300g", 'Snacks & Biscuits', "Munchy's", 'pack', 4.8, 'creamCrackers'],
    ['Nestle Kit Kat 4F 35g (4 pack)', 'Snacks & Biscuits', 'Nestle', 'pack', 5.9, 'chocolateBar'],
    ["Julie's Butter Crackers 250g", 'Snacks & Biscuits', "Julie's", 'pack', 5.5, 'butterCrackers'],
    ["Munchy's Lexus Cream Sandwich 190g", 'Snacks & Biscuits', "Munchy's", 'pack', 3.5, 'creamSandwichBiscuit'],
    ['Hup Seng Cream Crackers 428g', 'Snacks & Biscuits', 'Hup Seng', 'pack', 5.9, 'creamCrackers'],
    ["Jacob's Cream Crackers 227g", 'Snacks & Biscuits', "Jacob's", 'pack', 4.5, 'creamCrackers'],
    ['Mister Potato Chips Original 75g', 'Snacks & Biscuits', 'Mister Potato', 'pack', 3.9, 'potatoChips'],
    ['Twisties Cheese 60g', 'Snacks & Biscuits', 'Twisties', 'pack', 1.8, 'cornSnack'],
    ['Oreo Original 137g', 'Snacks & Biscuits', 'Oreo', 'pack', 4.2, 'sandwichCookie'],
    ['Apollo Layer Cake Chocolate 24x22g', 'Snacks & Biscuits', 'Apollo', 'pack', 9.9, 'layerCake'],
    // Canned Food
    ['Ayam Brand Sardines in Tomato Sauce 425g', 'Canned Food', 'Ayam Brand', 'can', 7.9, 'cannedSardines'],
    ['Ayam Brand Tuna Chunks in Water 185g', 'Canned Food', 'Ayam Brand', 'can', 7.5, 'cannedTuna'],
    ['Adabi Sambal Ikan Bilis 160g', 'Canned Food', 'Adabi', 'can', 4.5, 'cannedSambal'],
    ['Ayam Brand Baked Beans 425g', 'Canned Food', 'Ayam Brand', 'can', 4.2, 'cannedBakedBeans'],
    ['Marina Sardines in Tomato Sauce 425g', 'Canned Food', 'Marina', 'can', 5.9, 'cannedSardines'],
    ['Massimo Corned Beef 340g', 'Canned Food', 'Massimo', 'can', 9.9, 'cannedCornedBeef'],
    ['Narcissus Mushroom in Brine 425g', 'Canned Food', 'Narcissus', 'can', 5.5, 'cannedMushroom'],
    ['Ayam Brand Coconut Milk 400ml', 'Canned Food', 'Ayam Brand', 'can', 3.9, 'cannedCoconutMilk'],
    // Noodles & Pasta
    ['Maggi 2 Minute Noodles Curry (5x79g)', 'Noodles & Pasta', 'Maggi', 'pack', 5.2, 'instantNoodlesPack'],
    ['Maggi 2 Minute Noodles Asam Laksa (5x78g)', 'Noodles & Pasta', 'Maggi', 'pack', 5.4, 'instantNoodlesPack'],
    ['Maggi 2 Minute Noodles Tom Yam (5x80g)', 'Noodles & Pasta', 'Maggi', 'pack', 5.3, 'instantNoodlesPack'],
    ['Cintan Mi Sup (5x75g)', 'Noodles & Pasta', 'Cintan', 'pack', 4.5, 'instantNoodlesPack'],
    ['Maggi Mee Goreng (5x72g)', 'Noodles & Pasta', 'Maggi', 'pack', 5.5, 'instantNoodlesPack'],
    ['MyKuali Penang White Curry Noodles', 'Noodles & Pasta', 'MyKuali', 'pack', 3.5, 'whiteCurryNoodles'],
    ['Ibumie Express Kari (5x80g)', 'Noodles & Pasta', 'Ibumie', 'pack', 4.9, 'instantNoodlesPack'],
    ['Mi Sedaap Kari Special (5x75g)', 'Noodles & Pasta', 'Mi Sedaap', 'pack', 4.6, 'instantNoodlesPack'],
    ['Koka Instant Noodles Original (5x85g)', 'Noodles & Pasta', 'Koka', 'pack', 5.9, 'instantNoodlesPack'],
    ['Doll Instant Noodles Tomato (5pcs)', 'Noodles & Pasta', 'Doll', 'pack', 4.5, 'instantNoodlesPack'],
    // Sauces & Condiments
    ['Adabi Curry Powder 250g', 'Sauces & Condiments', 'Adabi', 'pack', 4.5, 'curryPowder'],
    ['Kimball Tomato Ketchup 500g', 'Sauces & Condiments', 'Kimball', 'bottle', 4.2, 'ketchupBottle'],
    ['Maggi Oyster Sauce 500g', 'Sauces & Condiments', 'Maggi', 'bottle', 6.8, 'oysterSauce'],
    ['Adabi Serbuk Kunyit 250g', 'Sauces & Condiments', 'Adabi', 'pack', 3.9, 'turmericPowder'],
    ['Kimball Chilli Sauce 500g', 'Sauces & Condiments', 'Kimball', 'bottle', 4.0, 'chilliSauce'],
    ["Lingham's Chilli Sauce 700g", 'Sauces & Condiments', "Lingham's", 'bottle', 7.9, 'chilliSauce'],
    ['Life Soy Sauce 640ml', 'Sauces & Condiments', 'Life', 'bottle', 4.5, 'soySauce'],
    ["Yeo's Chilli Sauce 340g", 'Sauces & Condiments', "Yeo's", 'bottle', 3.2, 'chilliSauce'],
    ['Maggi Chicken Stock Cubes (12s)', 'Sauces & Condiments', 'Maggi', 'pack', 5.5, 'stockCubes'],
    // Personal Care
    ['Dettol Antibacterial Shower Gel 950ml', 'Personal Care', 'Dettol', 'bottle', 19.9, 'showerGel'],
    ['Head & Shoulders Shampoo 330ml', 'Personal Care', 'Head & Shoulders', 'bottle', 15.9, 'shampoo'],
    ['Colgate Maximum Cavity Protection 250g', 'Personal Care', 'Colgate', 'unit', 8.5, 'toothpaste'],
    ['Sunsilk Shampoo Black Shine 320ml', 'Personal Care', 'Sunsilk', 'bottle', 13.9, 'shampoo'],
    ['Rexona Deodorant Roll On 50ml', 'Personal Care', 'Rexona', 'unit', 9.9, 'deodorant'],
    ['Nivea Body Lotion 400ml', 'Personal Care', 'Nivea', 'bottle', 17.9, 'bodyLotion'],
    ['Darlie Toothpaste Double Action 225g', 'Personal Care', 'Darlie', 'unit', 7.5, 'toothpaste'],
    ['Dettol Antiseptic Liquid 500ml', 'Personal Care', 'Dettol', 'bottle', 14.9, 'antisepticLiquid'],
    ['Zam-Zam Kids Shampoo 200ml', 'Personal Care', 'Zam-Zam', 'bottle', 8.9, 'shampoo'],
    // Household
    ['Dynamo Liquid Detergent 2.7kg', 'Household', 'Dynamo', 'bottle', 25.9, 'liquidDetergent'],
    ['Breeze Powder Detergent 2.5kg', 'Household', 'Breeze', 'pack', 18.9, 'powderDetergent'],
    ['Clorox Bleach Original 1L', 'Household', 'Clorox', 'bottle', 6.9, 'bleach'],
    ['Vim Dishwashing Liquid 900ml', 'Household', 'Vim', 'bottle', 5.5, 'dishwashingLiquid'],
    ['Glade Air Freshener Spray 320ml', 'Household', 'Glade', 'unit', 11.9, 'airFreshenerSpray'],
    ['Ridsect Mosquito Coil (10pcs)', 'Household', 'Ridsect', 'pack', 3.9, 'mosquitoCoil'],
    ['Mr Muscle Bathroom Cleaner 500ml', 'Household', 'Mr Muscle', 'bottle', 9.9, 'bathroomCleaner'],
    ['Kao Attack Detergent Powder 3.8kg', 'Household', 'Kao Attack', 'pack', 29.9, 'powderDetergent'],
    // Bread & Bakery
    ['Gardenia Original Classic Bread 400g', 'Bread & Bakery', 'Gardenia', 'pack', 3.2, 'whiteBreadLoaf'],
    ['Gardenia Wholemeal Bread 400g', 'Bread & Bakery', 'Gardenia', 'pack', 3.8, 'wholemealBreadLoaf'],
    ['High5 White Bread 400g', 'Bread & Bakery', 'High5', 'pack', 2.9, 'whiteBreadLoaf'],
    ['Massimo Sandwich Bread 400g', 'Bread & Bakery', 'Massimo', 'pack', 3.5, 'whiteBreadLoaf'],
    ['Gardenia Jumbo White Bread 600g', 'Bread & Bakery', 'Gardenia', 'pack', 4.5, 'whiteBreadLoaf'],
    // Fruits & Vegetables
    ['Local Round Cabbage', 'Fruits & Vegetables', null, 'kg', 4.5, 'cabbage'],
    ['Australian Carrot', 'Fruits & Vegetables', null, 'kg', 5.9, 'carrot'],
    ['Pisang Berangan', 'Fruits & Vegetables', null, 'kg', 6.5, 'banana'],
    ['Local Tomato', 'Fruits & Vegetables', null, 'kg', 5.5, 'tomato'],
    ['Cameron Highlands Lettuce', 'Fruits & Vegetables', null, 'kg', 8.9, 'lettuce'],
    ['Local Cucumber', 'Fruits & Vegetables', null, 'kg', 3.5, 'cucumber'],
    ['Local Long Bean', 'Fruits & Vegetables', null, 'kg', 6.9, 'longBean'],
    ['Red Apple (Fuji)', 'Fruits & Vegetables', null, 'kg', 9.9, 'apple'],
    ['Local Watermelon', 'Fruits & Vegetables', null, 'kg', 3.9, 'watermelon'],
    ['Sweet Potato', 'Fruits & Vegetables', null, 'kg', 5.9, 'sweetPotato'],
    // Meat & Seafood
    ['Fresh Chicken Whole', 'Meat & Seafood', null, 'kg', 9.9, 'wholeChicken'],
    ['Beef Topside Local', 'Meat & Seafood', null, 'kg', 38.0, 'beef'],
    ['Chicken Breast Fillet', 'Meat & Seafood', null, 'kg', 12.9, 'chickenBreast'],
    ['Chicken Wings', 'Meat & Seafood', null, 'kg', 11.9, 'chickenWings'],
    ['Fresh Tilapia Fish', 'Meat & Seafood', null, 'kg', 14.9, 'tilapiaFish'],
    ['Fresh Prawns Medium', 'Meat & Seafood', null, 'kg', 32.0, 'prawns'],
    ['Mackerel (Ikan Kembung)', 'Meat & Seafood', null, 'kg', 18.9, 'mackerel'],
  ];

  const groceryProducts = await Product.insertMany(
    grocery.map(([productName, category, brandName, unit, , typeKey], i) => ({
      barcode: `95500${String(i + 100).padStart(4, '0')}`,
      productName,
      description: productName,
      categoryId: cat(category),
      brandId: brandName ? brand(brandName) : null,
      image: productImage(typeKey, category),
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

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
    ['Baking Ingredients', 'cube-outline'],
    ['Biscuits & Cakes', 'pizza-outline'],
    ['Canned Food', 'file-tray-outline'],
    ['Cereals', 'sunny-outline'],
    ['Chocolates, Sweets & Jelly', 'ice-cream-outline'],
    ['Commodities', 'basket-outline'],
    ['Jams, Spreads & Honey', 'flask-outline'],
    ['Pasta & Instant Food', 'restaurant-outline'],
    ['Sauce, Spice & Seasoning', 'color-fill-outline'],
    ['Snacks', 'fast-food-outline'],
  ];
  const categories = await Category.insertMany(
    CATS.map(([categoryName, icon], i) => ({ categoryName, icon, order: i }))
  );
  const cat = (n) => categories.find((c) => c.categoryName === n)._id;
  console.log(`📁 ${categories.length} product categories`);

  // One representative photo per category (Unsplash, direct CDN links) — every
  // product in a category shares its picture since we don't have per-SKU photography.
  const CATEGORY_IMAGES = {
    'Baking Ingredients': '1699315529894-402495fddb8b',
    'Biscuits & Cakes': '1464195085758-89f3e55e821e',
    'Canned Food': '1738618140037-09e11c8e644a',
    Cereals: '1741521641060-ac14877a6472',
    'Chocolates, Sweets & Jelly': '1703319953569-72084ac406b6',
    Commodities: '1586201375761-83865001e31c',
    'Jams, Spreads & Honey': '1568657704598-602700bd9694',
    'Pasta & Instant Food': '1570715586318-640b87430b16',
    'Sauce, Spice & Seasoning': '1608736427500-c547edecc2b1',
    Snacks: '1741520149946-d2e652514b5a',
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
    salt: '1645007489014-235185d38791',
    bakingPowder: '1638405803126-d12de49c7d47',
    cocoaPowder: '1523035274455-b2e5c6d5c2e0',
    cornFlakes: '1741521641060-ac14877a6472',
    oats: '1574484292000-0dde0fb1b228',
    chocolateCereal: 'PEXELS:https://images.pexels.com/photos/14153472/pexels-photo-14153472.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop',
    gummyCandy: '1703319953569-72084ac406b6',
    jellyCup: 'PEXELS:https://images.pexels.com/photos/17565597/pexels-photo-17565597.jpeg?w=400&h=400&fit=crop&dpr=1',
    chocolateSpread: '1543254077-8bd7c22afbf1',
    fruitJam: '1665564773243-874c875421f2',
    honey: '1568657704598-602700bd9694',
    peanutButter: '1667803546535-81f5b1c4dbfb',
    kaya: '1611755245722-4de68826dc6f',
    spaghetti: '1570715586318-640b87430b16',
    macaroni: 'PEXELS:https://images.pexels.com/photos/37416579/pexels-photo-37416579.jpeg?w=400&h=400&fit=crop&auto=compress&cs=tinysrgb',
    blackPepper: '1748408004335-7d8752081851',
    prawnCrackers: 'PEXELS:https://images.pexels.com/photos/5848620/pexels-photo-5848620.jpeg?w=400&h=400&fit=crop&auto=compress&cs=tinysrgb',
    fishCrackers: 'PEXELS:https://images.pexels.com/photos/35644152/pexels-photo-35644152.jpeg?w=400&h=400&fit=crop&auto=compress&cs=tinysrgb',
    roastedPeanuts: 'PEXELS:https://images.pexels.com/photos/4202964/pexels-photo-4202964.jpeg?w=400&h=400&fit=crop&auto=compress&cs=tinysrgb',
    gulaMelaka: 'WIKIMEDIA:https://upload.wikimedia.org/wikipedia/commons/c/c9/Gula_melaka.jpg',
    cannedMushroom: 'PIXABAY:https://cdn.pixabay.com/photo/2017/05/18/16/54/mushrooms-2324111_1280.jpg',
    cannedCoconutMilk: 'WIKIMEDIA:https://upload.wikimedia.org/wikipedia/commons/5/5d/Kokosmj%C3%B6lk_i_konservburk.jpg',
    oysterSauce: 'WIKIMEDIA:https://upload.wikimedia.org/wikipedia/commons/7/78/OysterSauce2.jpg',
    yeast: 'WIKIMEDIA:https://upload.wikimedia.org/wikipedia/commons/9/98/Instant_Yeast_package_-_Fleischmann%27s.jpg',
    vanillaEssence: 'WIKIMEDIA:https://upload.wikimedia.org/wikipedia/commons/9/9e/Adams_Extract.JPG',
    candyRoll: 'WIKIMEDIA:https://upload.wikimedia.org/wikipedia/commons/a/ad/Polo_mints.jpg',
    // No good free-stock match found after exhausting Unsplash, Pexels, Pixabay and
    // Wikimedia Commons — falls back to the category photo: cannedSambal (too niche
    // a packaged product — only fresh/plated or bottled-not-canned photos exist),
    // oatmealSachet (every free photo shows prepared oats, never the sachet itself).
  };
  const productImage = (typeKey, category) => {
    const id = PRODUCT_IMAGES[typeKey];
    if (!id) return categoryImage(category);
    const prefixed = id.match(/^(PEXELS|WIKIMEDIA|PIXABAY):(.+)$/);
    if (prefixed) return prefixed[2];
    return `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&q=80&auto=format`;
  };

  // ---- BRANDS ----
  const brandNames = [
    // Commodities
    'Jasmine', 'Knife', 'CSR', 'Cap Kipas Udang', 'Saji', 'Vesawit', 'Cap Rambutan', 'Gula Prai',
    'Faiza', 'Herba', 'Sri Ganti', 'Jati', 'Segi Enam', 'Buruh', 'Naturub', 'Seri Pelangi',
    // Baking Ingredients
    'Prima', 'FFM', 'Hoover', 'Mauripan', 'Van Houten',
    // Biscuits & Cakes
    "Munchy's", "Julie's", 'Hup Seng', "Jacob's", 'Oreo', 'Apollo', 'Gardenia',
    // Canned Food
    'Ayam Brand', 'Adabi', 'Marina', 'Massimo', 'Narcissus',
    // Cereals
    "Kellogg's", 'Nestle', 'Quaker',
    // Chocolates, Sweets & Jelly
    'Cadbury', 'Mentos', 'Hacks', 'Haribo', 'Yupi', "Beryl's",
    // Commodities continued / Jams, Spreads & Honey
    'Nutella', 'Nona', 'Capilano', 'Skippy', 'Hubba',
    // Pasta & Instant Food
    'Maggi', 'Cintan', 'MyKuali', 'Ibumie', 'Mi Sedaap', 'Koka', 'Doll', 'Del Monte',
    // Sauce, Spice & Seasoning
    'Kimball', "Yeo's", "Lingham's", 'Life',
    // Snacks
    'Mister Potato', 'Twisties', 'Calbee', 'Mamee', 'Jack n Jill', 'Cap Kuda',
  ];
  const brands = await Brand.insertMany(brandNames.map((brandName) => ({ brandName })));
  const brand = (n) => brands.find((b) => b.brandName === n)._id;
  console.log(`🏷️  ${brands.length} brands`);

  // ---- GROCERY CATALOGUE ----
  // Hand-compiled from general knowledge of real Malaysian grocery brands/SKUs and
  // typical retail pricing — NOT scraped from any retailer's site (several explicitly
  // disallow AI crawling in robots.txt, which we respect). Sample data, edit via admin.
  const grocery = [
    // Commodities (rice, cooking oil, sugar, salt)
    ['Jasmine Super Special Local White Rice 5kg', 'Commodities', 'Jasmine', 'bag', 24.9, 'riceWhite'],
    ['Jasmine Super 5 Imported Rice 10kg', 'Commodities', 'Jasmine', 'bag', 47.9, 'riceWhite'],
    ['Cap Rambutan Beras Wangi 5kg', 'Commodities', 'Cap Rambutan', 'bag', 26.9, 'riceWhite'],
    ['Jasmine Beras Super Special 10kg', 'Commodities', 'Jasmine', 'bag', 46.9, 'riceWhite'],
    ['Jasmine Basmathi Rice 5kg', 'Commodities', 'Jasmine', 'bag', 32.9, 'riceWhite'],
    ['Faiza Beras Super Tempatan 10kg', 'Commodities', 'Faiza', 'bag', 45.9, 'riceWhite'],
    ['Herba Ponni Rice 5kg', 'Commodities', 'Herba', 'bag', 22.9, 'riceWhite'],
    ['Sri Ganti Beras Wangi Import 5kg', 'Commodities', 'Sri Ganti', 'bag', 27.9, 'riceWhite'],
    ['Jati Beras Super Tempatan 5kg', 'Commodities', 'Jati', 'bag', 23.9, 'riceWhite'],
    ['Segi Enam Beras Tempatan 10kg', 'Commodities', 'Segi Enam', 'bag', 42.9, 'riceWhite'],
    ['Faiza Brown Rice 2kg', 'Commodities', 'Faiza', 'bag', 14.9, 'riceBrown'],
    ['Jasmine Glutinous Rice (Pulut) 1kg', 'Commodities', 'Jasmine', 'pack', 8.9, 'riceGlutinous'],
    ['Knife Cooking Oil 5kg', 'Commodities', 'Knife', 'bottle', 29.5, 'cookingOil'],
    ['Saji Cooking Oil 5kg', 'Commodities', 'Saji', 'bottle', 27.9, 'cookingOil'],
    ['Vesawit Cooking Oil 5kg', 'Commodities', 'Vesawit', 'bottle', 26.5, 'cookingOil'],
    ['Knife Cooking Oil 2kg', 'Commodities', 'Knife', 'bottle', 13.9, 'cookingOil'],
    ['Buruh Cooking Oil 5kg', 'Commodities', 'Buruh', 'bottle', 26.9, 'cookingOil'],
    ['Naturub Cooking Oil 5kg', 'Commodities', 'Naturub', 'bottle', 25.9, 'cookingOil'],
    ['Seri Pelangi Cooking Oil 3kg', 'Commodities', 'Seri Pelangi', 'bottle', 16.9, 'cookingOil'],
    ['CSR Fine Grain Sugar 1kg', 'Commodities', 'CSR', 'pack', 2.85, 'sugar'],
    ['Gula Prai White Sugar 1kg', 'Commodities', 'Gula Prai', 'pack', 2.8, 'sugar'],
    ['CSR Gula Kastor 500g', 'Commodities', 'CSR', 'pack', 3.5, 'sugar'],
    ['Cap Kipas Udang Cooking Salt 800g', 'Commodities', 'Cap Kipas Udang', 'pack', 1.5, 'salt'],
    // Baking Ingredients
    ['Cap Kipas Udang Superfine Flour 1kg', 'Baking Ingredients', 'Cap Kipas Udang', 'pack', 2.2, 'flour'],
    ['Prima Plain Flour 1kg', 'Baking Ingredients', 'Prima', 'pack', 2.5, 'flour'],
    ['FFM Self Raising Flour 1kg', 'Baking Ingredients', 'FFM', 'pack', 2.9, 'flour'],
    ['Gula Melaka (Palm Sugar) 500g', 'Baking Ingredients', null, 'pack', 6.9, 'gulaMelaka'],
    ['Hoover Baking Powder 100g', 'Baking Ingredients', 'Hoover', 'unit', 3.5, 'bakingPowder'],
    ['Mauripan Instant Yeast 11g x4', 'Baking Ingredients', 'Mauripan', 'pack', 4.5, 'yeast'],
    ['Van Houten Cocoa Powder 150g', 'Baking Ingredients', 'Van Houten', 'pack', 12.9, 'cocoaPowder'],
    ['Adabi Vanilla Essence 100ml', 'Baking Ingredients', 'Adabi', 'bottle', 4.9, 'vanillaEssence'],
    // Biscuits & Cakes
    ["Munchy's Cream Crackers 300g", 'Biscuits & Cakes', "Munchy's", 'pack', 4.8, 'creamCrackers'],
    ["Julie's Butter Crackers 250g", 'Biscuits & Cakes', "Julie's", 'pack', 5.5, 'butterCrackers'],
    ["Munchy's Lexus Cream Sandwich 190g", 'Biscuits & Cakes', "Munchy's", 'pack', 3.5, 'creamSandwichBiscuit'],
    ['Hup Seng Cream Crackers 428g', 'Biscuits & Cakes', 'Hup Seng', 'pack', 5.9, 'creamCrackers'],
    ["Jacob's Cream Crackers 227g", 'Biscuits & Cakes', "Jacob's", 'pack', 4.5, 'creamCrackers'],
    ['Apollo Layer Cake Chocolate 24x22g', 'Biscuits & Cakes', 'Apollo', 'pack', 9.9, 'layerCake'],
    ['Gardenia Twiggies Chocolate Cake 300g', 'Biscuits & Cakes', 'Gardenia', 'pack', 3.9, 'layerCake'],
    // Canned Food
    ['Ayam Brand Sardines in Tomato Sauce 425g', 'Canned Food', 'Ayam Brand', 'can', 7.9, 'cannedSardines'],
    ['Ayam Brand Tuna Chunks in Water 185g', 'Canned Food', 'Ayam Brand', 'can', 7.5, 'cannedTuna'],
    ['Adabi Sambal Ikan Bilis 160g', 'Canned Food', 'Adabi', 'can', 4.5, 'cannedSambal'],
    ['Ayam Brand Baked Beans 425g', 'Canned Food', 'Ayam Brand', 'can', 4.2, 'cannedBakedBeans'],
    ['Marina Sardines in Tomato Sauce 425g', 'Canned Food', 'Marina', 'can', 5.9, 'cannedSardines'],
    ['Massimo Corned Beef 340g', 'Canned Food', 'Massimo', 'can', 9.9, 'cannedCornedBeef'],
    ['Narcissus Mushroom in Brine 425g', 'Canned Food', 'Narcissus', 'can', 5.5, 'cannedMushroom'],
    ['Ayam Brand Coconut Milk 400ml', 'Canned Food', 'Ayam Brand', 'can', 3.9, 'cannedCoconutMilk'],
    // Cereals
    ["Kellogg's Corn Flakes 500g", 'Cereals', "Kellogg's", 'pack', 14.9, 'cornFlakes'],
    ["Kellogg's Frosted Flakes 500g", 'Cereals', "Kellogg's", 'pack', 15.9, 'cornFlakes'],
    ['Nestle Koko Krunch 330g', 'Cereals', 'Nestle', 'pack', 13.9, 'chocolateCereal'],
    ['Nestle Milo Cereal 170g', 'Cereals', 'Nestle', 'pack', 9.5, 'chocolateCereal'],
    ['Quaker Oats Quick Cooking 800g', 'Cereals', 'Quaker', 'pack', 16.9, 'oats'],
    ['Quaker Instant Oatmeal Original 10x28g', 'Cereals', 'Quaker', 'pack', 9.9, 'oatmealSachet'],
    // Chocolates, Sweets & Jelly
    ['Nestle Kit Kat 4F 35g (4 pack)', 'Chocolates, Sweets & Jelly', 'Nestle', 'pack', 5.9, 'chocolateBar'],
    ['Cadbury Dairy Milk Chocolate 150g', 'Chocolates, Sweets & Jelly', 'Cadbury', 'pack', 11.9, 'chocolateBar'],
    ["Beryl's Milk Chocolate 100g", 'Chocolates, Sweets & Jelly', "Beryl's", 'pack', 8.9, 'chocolateBar'],
    ['Mentos Mint Roll 37.5g', 'Chocolates, Sweets & Jelly', 'Mentos', 'unit', 2.5, 'candyRoll'],
    ['Hacks Menthol Sweets 125g', 'Chocolates, Sweets & Jelly', 'Hacks', 'pack', 3.9, 'candyRoll'],
    ['Haribo Goldbears Gummy 100g', 'Chocolates, Sweets & Jelly', 'Haribo', 'pack', 6.9, 'gummyCandy'],
    ['Yupi Gummy Candy 125g', 'Chocolates, Sweets & Jelly', 'Yupi', 'pack', 4.5, 'gummyCandy'],
    ['Fruity Jelly Cup Assorted 12s', 'Chocolates, Sweets & Jelly', null, 'pack', 5.5, 'jellyCup'],
    // Jams, Spreads & Honey
    ['Nutella Chocolate Hazelnut Spread 350g', 'Jams, Spreads & Honey', 'Nutella', 'jar', 9.9, 'chocolateSpread'],
    ['Nona Pineapple Jam 330g', 'Jams, Spreads & Honey', 'Nona', 'jar', 5.9, 'fruitJam'],
    ['Nona Strawberry Jam 330g', 'Jams, Spreads & Honey', 'Nona', 'jar', 5.9, 'fruitJam'],
    ['Capilano Pure Honey 500g', 'Jams, Spreads & Honey', 'Capilano', 'bottle', 19.9, 'honey'],
    ['Skippy Peanut Butter Smooth 340g', 'Jams, Spreads & Honey', 'Skippy', 'jar', 10.9, 'peanutButter'],
    ['Hubba Kaya Spread (Coconut Jam) 330g', 'Jams, Spreads & Honey', 'Hubba', 'jar', 7.9, 'kaya'],
    // Pasta & Instant Food
    ['Maggi 2 Minute Noodles Curry (5x79g)', 'Pasta & Instant Food', 'Maggi', 'pack', 5.2, 'instantNoodlesPack'],
    ['Maggi 2 Minute Noodles Asam Laksa (5x78g)', 'Pasta & Instant Food', 'Maggi', 'pack', 5.4, 'instantNoodlesPack'],
    ['Maggi 2 Minute Noodles Tom Yam (5x80g)', 'Pasta & Instant Food', 'Maggi', 'pack', 5.3, 'instantNoodlesPack'],
    ['Cintan Mi Sup (5x75g)', 'Pasta & Instant Food', 'Cintan', 'pack', 4.5, 'instantNoodlesPack'],
    ['Maggi Mee Goreng (5x72g)', 'Pasta & Instant Food', 'Maggi', 'pack', 5.5, 'instantNoodlesPack'],
    ['MyKuali Penang White Curry Noodles', 'Pasta & Instant Food', 'MyKuali', 'pack', 3.5, 'whiteCurryNoodles'],
    ['Ibumie Express Kari (5x80g)', 'Pasta & Instant Food', 'Ibumie', 'pack', 4.9, 'instantNoodlesPack'],
    ['Mi Sedaap Kari Special (5x75g)', 'Pasta & Instant Food', 'Mi Sedaap', 'pack', 4.6, 'instantNoodlesPack'],
    ['Koka Instant Noodles Original (5x85g)', 'Pasta & Instant Food', 'Koka', 'pack', 5.9, 'instantNoodlesPack'],
    ['Doll Instant Noodles Tomato (5pcs)', 'Pasta & Instant Food', 'Doll', 'pack', 4.5, 'instantNoodlesPack'],
    ['Del Monte Spaghetti 400g', 'Pasta & Instant Food', 'Del Monte', 'pack', 4.9, 'spaghetti'],
    ['Del Monte Macaroni 400g', 'Pasta & Instant Food', 'Del Monte', 'pack', 4.5, 'macaroni'],
    // Sauce, Spice & Seasoning
    ['Adabi Curry Powder 250g', 'Sauce, Spice & Seasoning', 'Adabi', 'pack', 4.5, 'curryPowder'],
    ['Kimball Tomato Ketchup 500g', 'Sauce, Spice & Seasoning', 'Kimball', 'bottle', 4.2, 'ketchupBottle'],
    ['Maggi Oyster Sauce 500g', 'Sauce, Spice & Seasoning', 'Maggi', 'bottle', 6.8, 'oysterSauce'],
    ['Adabi Serbuk Kunyit 250g', 'Sauce, Spice & Seasoning', 'Adabi', 'pack', 3.9, 'turmericPowder'],
    ['Kimball Chilli Sauce 500g', 'Sauce, Spice & Seasoning', 'Kimball', 'bottle', 4.0, 'chilliSauce'],
    ["Lingham's Chilli Sauce 700g", 'Sauce, Spice & Seasoning', "Lingham's", 'bottle', 7.9, 'chilliSauce'],
    ['Life Soy Sauce 640ml', 'Sauce, Spice & Seasoning', 'Life', 'bottle', 4.5, 'soySauce'],
    ["Yeo's Chilli Sauce 340g", 'Sauce, Spice & Seasoning', "Yeo's", 'bottle', 3.2, 'chilliSauce'],
    ['Maggi Chicken Stock Cubes (12s)', 'Sauce, Spice & Seasoning', 'Maggi', 'pack', 5.5, 'stockCubes'],
    ['Adabi Black Pepper Powder 50g', 'Sauce, Spice & Seasoning', 'Adabi', 'unit', 3.9, 'blackPepper'],
    // Snacks
    ['Mister Potato Chips Original 75g', 'Snacks', 'Mister Potato', 'pack', 3.9, 'potatoChips'],
    ['Twisties Cheese 60g', 'Snacks', 'Twisties', 'pack', 1.8, 'cornSnack'],
    ['Calbee Prawn Crackers 60g', 'Snacks', 'Calbee', 'pack', 3.2, 'prawnCrackers'],
    ['Mamee Monster Snack Noodle Chips 60g', 'Snacks', 'Mamee', 'pack', 1.5, 'cornSnack'],
    ['Jack n Jill Chippy BBQ 110g', 'Snacks', 'Jack n Jill', 'pack', 4.5, 'potatoChips'],
    ['Keropok Lekor (Fish Crackers) 200g', 'Snacks', null, 'pack', 6.5, 'fishCrackers'],
    ['Cap Kuda Roasted Peanuts 227g', 'Snacks', 'Cap Kuda', 'pack', 5.5, 'roastedPeanuts'],
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
    ['Knife Cooking Oil 5kg', 'discount', 0.1],
    ['Jasmine Super Special Local White Rice 5kg', 'discount', 0.09],
    ['Maggi 2 Minute Noodles Curry (5x79g)', 'buy1free1', 0.13],
    ['Ayam Brand Sardines in Tomato Sauce 425g', 'bundle', 0.13],
    ['CSR Fine Grain Sugar 1kg', 'discount', 0.07],
    ["Kellogg's Corn Flakes 500g", 'discount', 0.12],
    ['Nestle Kit Kat 4F 35g (4 pack)', 'discount', 0.14],
    ['Capilano Pure Honey 500g', 'discount', 0.11],
    ['Apollo Layer Cake Chocolate 24x22g', 'clearance', 0.18],
    ['Mister Potato Chips Original 75g', 'buy1free1', 0.15],
    ['Hoover Baking Powder 100g', 'discount', 0.09],
    ['Kimball Tomato Ketchup 500g', 'discount', 0.1],
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

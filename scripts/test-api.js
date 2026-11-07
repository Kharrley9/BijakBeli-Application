/**
 * test-api.js — Automated API smoke tests for BijakBeli
 * 
 * Run:  node scripts/test-api.js
 * 
 * Requires the server to be running on localhost:5000
 */

const BASE = 'http://localhost:5000/api';
let TOKEN = '';
let userId = '';
let productId = '';
let storeId = '';
let listId = '';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
  }
}

async function run() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 BijakBeli API Smoke Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Health check
  console.log('📡 Health Check');
  const health = await request('GET', '/health');
  assert(health.status === 200, 'GET /health returns 200');

  // 2. Register
  console.log('\n👤 Authentication');
  const reg = await request('POST', '/auth/register', {
    fullName: 'Test User',
    email: `testuser_${Date.now()}@test.com`,
    password: 'test123456',
  });
  assert(reg.status === 201, 'POST /auth/register creates user');
  assert(reg.data?.data?.token, 'Register returns token');

  // 3. Login
  const login = await request('POST', '/auth/login', {
    email: 'khalil@example.com',
    password: 'password123',
  });
  assert(login.status === 200, 'POST /auth/login succeeds');
  assert(login.data?.data?.token, 'Login returns token');
  TOKEN = login.data?.data?.token || '';
  userId = login.data?.data?.user?._id || '';

  // 4. Get Me
  const me = await request('GET', '/auth/me');
  assert(me.status === 200, 'GET /auth/me returns user');
  assert(me.data?.data?.fullName === 'Khalil Ahmad', 'User is Khalil Ahmad');

  // 5. Stores
  console.log('\n🏪 Stores');
  const stores = await request('GET', '/stores');
  assert(stores.status === 200, 'GET /stores returns 200');
  const storesData = stores.data?.data || stores.data || [];
  assert(Array.isArray(storesData) && storesData.length >= 5, `Found ${storesData.length} stores`);
  storeId = storesData[0]?._id || '';

  // 6. Categories
  console.log('\n📁 Categories');
  const cats = await request('GET', '/categories');
  assert(cats.status === 200, 'GET /categories returns 200');
  const catsData = cats.data?.data || cats.data || [];
  assert(Array.isArray(catsData) && catsData.length >= 10, `Found ${catsData.length} categories`);

  // 7. Products
  console.log('\n🛒 Products');
  const products = await request('GET', '/products');
  assert(products.status === 200, 'GET /products returns 200');
  const prodsData = products.data?.products || products.data?.data?.products || [];
  assert(Array.isArray(prodsData), 'Products returns array');
  productId = prodsData[0]?._id || '';

  // 8. Product search
  const search = await request('GET', '/products/search?q=milo');
  assert(search.status === 200, 'GET /products/search?q=milo returns 200');
  const searchData = search.data?.products || search.data?.data?.products || [];
  assert(searchData.length > 0, `Search "milo" found ${searchData.length} products`);

  // 9. Price comparison
  console.log('\n💰 Price Comparison');
  if (productId) {
    const compare = await request('GET', `/prices/compare/${productId}`);
    assert(compare.status === 200, `GET /prices/compare/${productId} returns 200`);
    const compData = compare.data?.data || {};
    assert(compData.comparisons?.length > 0, `Found ${compData.comparisons?.length} price comparisons`);
    assert(compData.cheapestStore !== null, `Cheapest store: ${compData.cheapestStore?.storeName}`);
  }

  // 10. Promotions
  console.log('\n🎉 Promotions');
  const promos = await request('GET', '/promotions/active');
  assert(promos.status === 200, 'GET /promotions/active returns 200');
  const promosData = promos.data?.data || [];
  assert(Array.isArray(promosData) && promosData.length > 0, `Found ${promosData.length} active promotions`);

  const bestDeals = await request('GET', '/promotions/best-deals');
  assert(bestDeals.status === 200, 'GET /promotions/best-deals returns 200');

  // 11. Budget
  console.log('\n💵 Budget');
  const budget = await request('GET', '/budgets/current');
  assert(budget.status === 200, 'GET /budgets/current returns 200');
  const budgetData = budget.data?.data || {};
  assert(budgetData.monthlyBudget === 300, `Monthly budget: RM${budgetData.monthlyBudget}`);

  // 12. Shopping List
  console.log('\n🛍️  Shopping List');
  const lists = await request('GET', '/shopping-lists');
  assert(lists.status === 200, 'GET /shopping-lists returns 200');
  const listsData = lists.data?.data || [];
  assert(Array.isArray(listsData) && listsData.length > 0, `Found ${listsData.length} shopping lists`);
  listId = listsData[0]?._id || '';

  if (listId) {
    const listDetail = await request('GET', `/shopping-lists/${listId}`);
    assert(listDetail.status === 200, `GET /shopping-lists/${listId} returns 200`);
    const listItems = listDetail.data?.data?.items || [];
    assert(listItems.length > 0, `Shopping list has ${listItems.length} items`);
  }

  // 13. Orders
  console.log('\n📦 Orders');
  if (productId && storeId) {
    const order = await request('POST', '/orders', {
      items: [{ productId, storeId, quantity: 1, price: 24.90 }],
    });
    assert(order.status === 201, 'POST /orders creates order');
  }

  const orders = await request('GET', '/orders');
  assert(orders.status === 200, 'GET /orders returns user orders');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏁 Tests Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

run().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});

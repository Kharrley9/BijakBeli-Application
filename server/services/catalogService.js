const Product = require('../models/Product');
const Price = require('../models/Price');
const priceComparisonService = require('./priceComparisonService');
const geoService = require('./geoService');

/**
 * Buyer-facing catalogue: product lists annotated with their cheapest price /
 * cheapest store / nearest store, and the full product-detail view.
 */
class CatalogService {
  /**
   * @param {object} f  filters: { storeCategory, categoryId, q, storeId, state, brandId }
   * @param {object} opts { page, limit, sort }  sort: 'price_asc' | 'nearest' | '-createdAt'
   * @param {{lat:number,lng:number}|null} origin
   */
  async listProducts(f = {}, opts = {}, origin = null) {
    const page = Math.max(1, parseInt(opts.page) || 1);
    const limit = Math.min(50, parseInt(opts.limit) || 15);

    const query = { status: 'active' };
    if (f.storeCategory) query.storeCategory = f.storeCategory;
    if (f.categoryId) query.categoryId = f.categoryId;
    if (f.brandId) query.brandId = f.brandId;
    if (f.q) {
      query.$or = [
        { productName: { $regex: f.q, $options: 'i' } },
        { description: { $regex: f.q, $options: 'i' } },
        { barcode: f.q },
      ];
    }

    // Restrict to products carried by a given store / stores in a state
    let allowedProductIds = null;
    if (f.storeId) {
      const rows = await Price.find({ storeId: f.storeId }).select('productId').lean();
      allowedProductIds = rows.map((r) => String(r.productId));
    } else if (f.state) {
      const Store = require('../models/Store');
      const stores = await Store.find({ state: f.state, isActive: true }).select('_id').lean();
      const ids = stores.map((s) => s._id);
      const rows = await Price.find({ storeId: { $in: ids } }).select('productId').lean();
      allowedProductIds = [...new Set(rows.map((r) => String(r.productId)))];
    }
    if (allowedProductIds) {
      query._id = { $in: allowedProductIds };
    }

    // Fetch a generous candidate set; we re-sort/paginate after pricing.
    const candidates = await Product.find(query)
      .populate('categoryId', 'categoryName group icon')
      .populate('brandId', 'brandName')
      .limit(300)
      .lean();

    const total = candidates.length;

    // Batch-load prices for all candidates
    const productIds = candidates.map((p) => p._id);
    const priceRows = await Price.find({ productId: { $in: productIds } })
      .populate(
        'storeId',
        'storeName logo kind storeCategory rating reviewCount deliveryFee deliveryAvailable location city state isActive'
      )
      .lean();

    const byProduct = new Map();
    for (const row of priceRows) {
      if (!row.storeId || row.storeId.isActive === false) continue;
      const key = String(row.productId);
      if (!byProduct.has(key)) byProduct.set(key, []);
      byProduct.get(key).push(row);
    }

    // Distances (once, for every store that appears)
    let distanceMap = new Map();
    if (origin && geoService.isValidCoord(origin)) {
      const uniqueStores = [];
      const seen = new Set();
      for (const row of priceRows) {
        const s = row.storeId;
        if (s && !seen.has(String(s._id))) {
          seen.add(String(s._id));
          uniqueStores.push(s);
        }
      }
      distanceMap = await geoService.getStoreDistances(origin, uniqueStores);
    }

    let items = candidates.map((p) => {
      const rows = byProduct.get(String(p._id)) || [];
      let cheapest = null;
      let nearest = null;
      for (const row of rows) {
        const s = row.storeId;
        const d = distanceMap.get(String(s._id));
        const entry = {
          price: row.price,
          previousPrice: row.previousPrice,
          store: {
            _id: s._id,
            storeName: s.storeName,
            logo: s.logo,
            kind: s.kind,
            rating: s.rating,
            city: s.city,
            state: s.state,
            deliveryAvailable: !!s.deliveryAvailable,
            deliveryFee: s.deliveryFee || 0,
            distanceKm: d ? d.distanceKm : null,
            durationMin: d ? d.durationMin : null,
          },
        };
        if (!cheapest || entry.price < cheapest.price) cheapest = entry;
        if (
          entry.store.distanceKm != null &&
          (!nearest || entry.store.distanceKm < nearest.store.distanceKm)
        ) {
          nearest = entry;
        }
      }
      return {
        ...p,
        storeCount: rows.length,
        lowestPrice: cheapest ? cheapest.price : null,
        cheapestStore: cheapest ? cheapest.store : null,
        nearestStore: nearest ? nearest.store : null,
      };
    });

    // Only products that have at least one price
    items = items.filter((i) => i.lowestPrice != null);

    // Sort
    const sort = opts.sort || '-createdAt';
    if (sort === 'price_asc') {
      items.sort((a, b) => a.lowestPrice - b.lowestPrice);
    } else if (sort === 'nearest') {
      items.sort((a, b) => {
        const da = a.nearestStore?.distanceKm ?? Infinity;
        const db = b.nearestStore?.distanceKm ?? Infinity;
        return da - db;
      });
    } else {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    return {
      products: paged,
      total: items.length,
      page,
      pages: Math.ceil(items.length / limit) || 1,
    };
  }

  /**
   * Full product detail with "prices at nearby stores".
   * Reuses priceComparisonService.comparePrices (already handles distance + nearest).
   */
  async getProductDetail(productId, origin = null) {
    const product = await Product.findById(productId)
      .populate('categoryId', 'categoryName group icon')
      .populate('brandId', 'brandName logo');
    if (!product) {
      const e = new Error('Product not found');
      e.statusCode = 404;
      throw e;
    }

    const comparison = await priceComparisonService.comparePrices(productId, [], origin);

    const stores = comparison.comparisons.map((c) => ({
      store: c.store,
      price: c.currentPrice,
      previousPrice: c.previousPrice,
      effectivePrice: c.effectivePrice,
      stock: c.stock,
      inStock: c.inStock,
      hasPromotion: c.hasPromotion,
      promotion: c.promotion,
      isLowestPrice: !!c.isLowestPrice,
      isNearest: !!c.isNearest,
    }));

    return {
      product,
      stores,
      cheapestStore: comparison.cheapestStore,
      nearestStore: comparison.nearestStore,
      lowestPrice: comparison.lowestPrice ?? null,
      highestPrice: comparison.highestPrice ?? null,
      savings: comparison.savings || 0,
      storeCount: stores.length,
    };
  }
}

module.exports = new CatalogService();

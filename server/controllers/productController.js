const productService = require('../services/productService');

exports.createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProduct(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const { page, limit, sort, status, city, state, store_id, storeId } = req.query;
    let query = status ? { status } : {};
    
    // Filter by store, city, or state
    const targetStoreId = store_id || storeId;
    if (targetStoreId || city || state) {
      const storeService = require('../services/storeService');
      const priceComparisonService = require('../services/priceComparisonService');
      
      let storeIds = [];
      if (targetStoreId) {
        storeIds = [targetStoreId];
      } else {
        const storeQuery = {};
        if (city) storeQuery.city = city;
        if (state) storeQuery.state = state;
        const stores = await storeService.getAllStores(storeQuery);
        storeIds = stores.map(s => s._id);
      }
      
      if (storeIds.length > 0) {
        const prices = await priceComparisonService.getAllPrices({ storeId: { $in: storeIds } }, { limit: 10000 });
        const productIds = prices.data.map(p => p.productId?._id || p.productId);
        query._id = { $in: productIds };
      } else {
        // No stores match, so no products
        query._id = null; // Forces empty result
      }
    }

    const result = await productService.getAllProducts(query, { page, limit, sort });
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const { q, categoryId, brandId, page, limit, sort } = req.query;
    const result = await productService.searchProducts(q, { categoryId, brandId }, { page, limit, sort });
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) { next(error); }
};

// GET /api/products/compare-stores?storeIds=id1,id2,id3
// Returns products that exist in ALL given stores, with price per store
exports.compareStores = async (req, res, next) => {
  try {
    const { storeIds, preferred_ids, categoryId, q, lat, lng } = req.query;
    if (!storeIds) {
      return res.status(400).json({ success: false, message: 'storeIds required' });
    }

    const ids = storeIds.split(',').filter(Boolean).slice(0, 3); // max 3
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one storeId required' });
    }

    const Price = require('../models/Price');
    const Store = require('../models/Store');
    const geoService = require('../services/geoService');

    // Get store details for the header
    let stores = await Store.find({ _id: { $in: ids } })
      .select('storeName mallName logo location city state')
      .lean();

    // Attach travel distance from the trader's origin (optional)
    let nearestStoreId = null;
    const origin =
      lat !== undefined && lng !== undefined
        ? { lat: Number(lat), lng: Number(lng) }
        : null;
    if (origin && geoService.isValidCoord(origin)) {
      const distances = await geoService.getStoreDistances(origin, stores);
      stores = stores.map((s) => {
        const d = distances.get(String(s._id));
        return {
          ...s,
          distanceKm: d ? d.distanceKm : null,
          durationMin: d ? d.durationMin : null,
          distanceSource: d ? d.source : null,
        };
      });
      nearestStoreId = geoService.pickNearestId(
        distances,
        stores.map((s) => s._id)
      );
    }

    // Find all prices for these stores
    let priceQuery = { storeId: { $in: ids } };
    if (preferred_ids) {
      const prefIds = preferred_ids.split(',').filter(Boolean);
      if (prefIds.length > 0) {
        priceQuery.productId = { $in: prefIds };
      } else {
        // If preferred_ids is empty string but provided, it means no preferred products
        return res.status(200).json({ success: true, data: { stores, products: [], totalProducts: 0 } });
      }
    }

    const prices = await Price.find(priceQuery)
      .populate({
        path: 'productId',
        select: 'productName image unit categoryId brandId',
        match: (categoryId || q) ? {
          ...(categoryId ? { categoryId } : {}),
          ...(q ? { productName: { $regex: q, $options: 'i' } } : {})
        } : undefined,
        populate: [
          { path: 'categoryId', select: 'categoryName' },
          { path: 'brandId', select: 'brandName' }
        ]
      })
      .populate('storeId', 'storeName mallName');

    // Group by product
    const productMap = {};
    for (const p of prices) {
      if (!p.productId) continue;
      const pid = p.productId._id.toString();
      if (!productMap[pid]) {
        productMap[pid] = {
          product: p.productId,
          prices: {},
        };
      }
      productMap[pid].prices[p.storeId._id.toString()] = {
        price: p.price,
        previousPrice: p.previousPrice,
        inStock: p.inStock !== false,
      };
    }

    // Only keep products that appear in AT LEAST ONE selected store (which is implicitly true since we grouped them)
    const products = Object.values(productMap);

    // For each product, determine cheapest store
    products.forEach(item => {
      let cheapestId = null;
      let cheapestPrice = Infinity;
      for (const [storeId, priceData] of Object.entries(item.prices)) {
        if (priceData.price < cheapestPrice) {
          cheapestPrice = priceData.price;
          cheapestId = storeId;
        }
      }
      item.cheapestStoreId = cheapestId;
    });

    res.status(200).json({
      success: true,
      data: {
        stores,
        products,
        totalProducts: products.length,
        nearestStoreId,
      }
    });
  } catch (error) { next(error); }
};

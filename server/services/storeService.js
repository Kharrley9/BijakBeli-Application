const storeRepository = require('../repositories/storeRepository');
const Price = require('../models/Price');
const Product = require('../models/Product');
const geoService = require('./geoService');

class StoreService {
  async createStore(data) {
    return await storeRepository.create(data);
  }

  /**
   * @param {object} filters { storeCategory, kind, state, city, q, admin }
   * @param {{lat:number,lng:number}|null} origin
   */
  async getAllStores(filters = {}, origin = null) {
    const query = {};
    if (!filters.admin) query.isActive = true;
    if (filters.storeCategory) query.storeCategory = filters.storeCategory;
    if (filters.kind) query.kind = filters.kind;
    if (filters.state) query.state = filters.state;
    if (filters.city) query.city = filters.city;
    if (filters.q) query.storeName = { $regex: filters.q, $options: 'i' };

    let stores = (await storeRepository.findAll(query)).map((s) =>
      s.toObject ? s.toObject() : s
    );

    if (origin && geoService.isValidCoord(origin)) {
      const distances = await geoService.getStoreDistances(origin, stores);
      stores = stores
        .map((s) => {
          const d = distances.get(String(s._id));
          return {
            ...s,
            distanceKm: d ? d.distanceKm : null,
            durationMin: d ? d.durationMin : null,
          };
        })
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return stores;
  }

  /**
   * Store + its product listings (for merchant stores) + rating.
   * @param {{lat:number,lng:number}|null} origin
   * @param {boolean} track  increment the view counter
   */
  async getStore(id, origin = null, track = false) {
    const store = await storeRepository.findById(id);
    if (!store) {
      const error = new Error('Store not found');
      error.statusCode = 404;
      throw error;
    }
    if (track) storeRepository.incrementViews(id).catch(() => {});

    const obj = store.toObject();

    // Distance from the buyer
    if (origin && geoService.isValidCoord(origin)) {
      const map = await geoService.getStoreDistances(origin, [store]);
      const d = map.get(String(store._id));
      obj.distanceKm = d ? d.distanceKm : null;
      obj.durationMin = d ? d.durationMin : null;
    }

    // Product listings sold at this store
    const priceRows = await Price.find({ storeId: id })
      .populate({
        path: 'productId',
        select: 'productName image unit storeCategory categoryId status',
        populate: { path: 'categoryId', select: 'categoryName' },
      })
      .lean();

    obj.products = priceRows
      .filter((r) => r.productId && r.productId.status !== 'discontinued')
      .map((r) => ({
        _id: r.productId._id,
        productName: r.productId.productName,
        image: r.productId.image,
        unit: r.productId.unit,
        storeCategory: r.productId.storeCategory,
        category: r.productId.categoryId?.categoryName,
        price: r.price,
        previousPrice: r.previousPrice,
        stock: r.stock,
        inStock: r.inStock !== false,
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName));
    obj.productCount = obj.products.length;

    return obj;
  }

  async updateStore(id, data) {
    const store = await storeRepository.update(id, data);
    if (!store) {
      const error = new Error('Store not found');
      error.statusCode = 404;
      throw error;
    }
    return store;
  }

  async deleteStore(id) {
    const store = await storeRepository.delete(id);
    if (!store) {
      const error = new Error('Store not found');
      error.statusCode = 404;
      throw error;
    }
    await Price.deleteMany({ storeId: id });
    return store;
  }

  async getStoreCount() {
    return await storeRepository.count();
  }

  /**
   * Stores near an origin, nearest first, annotated with distanceKm / durationMin.
   * @param {{ lat, lng, maxKm?, limit?, storeCategory?, kind? }} opts
   */
  async getNearbyStores({ lat, lng, maxKm = 60, limit = 50, storeCategory, kind }) {
    const origin = { lat: Number(lat), lng: Number(lng) };
    if (!geoService.isValidCoord(origin)) {
      const error = new Error('Valid lat and lng are required');
      error.statusCode = 400;
      throw error;
    }

    const extra = {};
    if (storeCategory) extra.storeCategory = storeCategory;
    if (kind) extra.kind = kind;

    const stores = await storeRepository.findNear(
      origin.lng,
      origin.lat,
      Math.max(1, Number(maxKm)) * 1000,
      Math.min(100, Number(limit) || 50),
      extra
    );

    const distances = await geoService.getStoreDistances(origin, stores);

    return stores.map((s) => {
      const d = distances.get(String(s._id));
      const distanceKm =
        (d && d.distanceKm) ??
        (typeof s.distanceMeters === 'number'
          ? Math.round(s.distanceMeters / 100) / 10
          : undefined);
      return {
        ...s,
        distanceMeters: undefined,
        distanceKm,
        durationMin: d ? d.durationMin : geoService.estimateDurationMin(distanceKm || 0),
        distanceSource: d ? d.source : 'estimate',
      };
    });
  }
}

module.exports = new StoreService();

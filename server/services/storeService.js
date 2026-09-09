const storeRepository = require('../repositories/storeRepository');
const Price = require('../models/Price');
const geoService = require('./geoService');

class StoreService {
  async createStore(data) {
    return await storeRepository.create(data);
  }

  async getStore(id) {
    const store = await storeRepository.findById(id);
    if (!store) {
      const error = new Error('Store not found');
      error.statusCode = 404;
      throw error;
    }
    return store;
  }

  async getAllStores(query = {}) {
    return await storeRepository.findAll(query);
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
    // Cascade delete: remove all prices associated with this store
    await Price.deleteMany({ storeId: id });
    return store;
  }

  async getStoreCount() {
    return await storeRepository.count();
  }

  /**
   * Stores near an origin, nearest first, each annotated with distanceKm and
   * an estimated durationMin.
   * @param {{ lat:number, lng:number, maxKm?:number, limit?:number }} opts
   */
  async getNearbyStores({ lat, lng, maxKm = 60, limit = 50 }) {
    const origin = { lat: Number(lat), lng: Number(lng) };
    if (!geoService.isValidCoord(origin)) {
      const error = new Error('Valid lat and lng are required');
      error.statusCode = 400;
      throw error;
    }

    const stores = await storeRepository.findNear(
      origin.lng,
      origin.lat,
      Math.max(1, Number(maxKm)) * 1000,
      Math.min(100, Number(limit) || 50)
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

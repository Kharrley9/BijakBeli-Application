const storeRepository = require('../repositories/storeRepository');

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

  async getAllStores() {
    return await storeRepository.findAll();
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
    return store;
  }

  async getStoreCount() {
    return await storeRepository.count();
  }
}

module.exports = new StoreService();

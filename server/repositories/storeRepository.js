const Store = require('../models/Store');

class StoreRepository {
  async create(data) {
    return await Store.create(data);
  }

  async findById(id) {
    return await Store.findById(id);
  }

  async findAll(query = {}) {
    return await Store.find(query).sort('storeName');
  }

  async update(id, data) {
    return await Store.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return await Store.findByIdAndDelete(id);
  }

  async count() {
    return await Store.countDocuments();
  }
}

module.exports = new StoreRepository();

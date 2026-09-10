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

  async findByOwner(ownerId) {
    return await Store.findOne({ ownerId });
  }

  async update(id, data) {
    return await Store.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return await Store.findByIdAndDelete(id);
  }

  async count(query = {}) {
    return await Store.countDocuments(query);
  }

  async incrementViews(id) {
    return await Store.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }

  /**
   * Active stores near a point, nearest first.
   * @param {number} lng
   * @param {number} lat
   * @param {number} maxMeters
   * @param {number} limit
   * @param {object} extraQuery  additional $geoNear query filter (e.g. { storeCategory })
   * @returns {Promise<Array>} store docs with an added `distanceMeters` field
   */
  async findNear(lng, lat, maxMeters, limit = 50, extraQuery = {}) {
    return await Store.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          maxDistance: maxMeters,
          query: { isActive: true, ...extraQuery },
          spherical: true,
        },
      },
      { $limit: limit },
    ]);
  }
}

module.exports = new StoreRepository();

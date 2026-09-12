const FavoriteStore = require('../models/FavoriteStore');

class FavoriteStoreRepository {
  async add(userId, storeId) {
    return await FavoriteStore.create({ userId, storeId });
  }

  async remove(userId, storeId) {
    return await FavoriteStore.findOneAndDelete({ userId, storeId });
  }

  async findByUser(userId) {
    return await FavoriteStore.find({ userId })
      .populate('storeId', 'storeName logo bannerImage storeCategory city state kind rating reviewCount deliveryAvailable deliveryFee isActive')
      .sort('-createdAt');
  }

  async isFavorite(userId, storeId) {
    return !!(await FavoriteStore.findOne({ userId, storeId }));
  }
}

module.exports = new FavoriteStoreRepository();

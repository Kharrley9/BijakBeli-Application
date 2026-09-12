const favoriteStoreRepository = require('../repositories/favoriteStoreRepository');

class FavoriteStoreService {
  async toggle(userId, storeId) {
    const exists = await favoriteStoreRepository.isFavorite(userId, storeId);
    if (exists) {
      await favoriteStoreRepository.remove(userId, storeId);
      return { isFavorite: false };
    }
    await favoriteStoreRepository.add(userId, storeId);
    return { isFavorite: true };
  }

  async listMine(userId) {
    const rows = await favoriteStoreRepository.findByUser(userId);
    return rows.filter((r) => r.storeId);
  }

  async check(userId, storeId) {
    return favoriteStoreRepository.isFavorite(userId, storeId);
  }
}

module.exports = new FavoriteStoreService();

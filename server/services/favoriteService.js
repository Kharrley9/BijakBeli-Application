const favoriteRepository = require('../repositories/favoriteRepository');

class FavoriteService {
  async toggleFavorite(userId, productId) {
    const exists = await favoriteRepository.isFavorite(userId, productId);
    if (exists) {
      await favoriteRepository.remove(userId, productId);
      return { isFavorite: false };
    }
    await favoriteRepository.add(userId, productId);
    return { isFavorite: true };
  }

  async getUserFavorites(userId) {
    return await favoriteRepository.findByUser(userId);
  }

  async checkFavorite(userId, productId) {
    return await favoriteRepository.isFavorite(userId, productId);
  }
}

module.exports = new FavoriteService();

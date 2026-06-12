const FavoriteProduct = require('../models/FavoriteProduct');

class FavoriteRepository {
  async add(userId, productId) {
    return await FavoriteProduct.create({ userId, productId });
  }

  async remove(userId, productId) {
    return await FavoriteProduct.findOneAndDelete({ userId, productId });
  }

  async findByUser(userId) {
    return await FavoriteProduct.find({ userId })
      .populate({
        path: 'productId',
        populate: [
          { path: 'categoryId', select: 'categoryName' },
          { path: 'brandId', select: 'brandName' },
        ],
      })
      .sort('-createdAt');
  }

  async isFavorite(userId, productId) {
    const fav = await FavoriteProduct.findOne({ userId, productId });
    return !!fav;
  }
}

module.exports = new FavoriteRepository();

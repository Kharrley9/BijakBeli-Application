const Price = require('../models/Price');

class PriceRepository {
  async create(data) {
    return await Price.create(data);
  }

  async findByProductAndStore(productId, storeId) {
    return await Price.findOne({ productId, storeId });
  }

  async findByProduct(productId) {
    return await Price.find({ productId })
      .populate('storeId', 'storeName mallName logo location city state')
      .sort('price');
  }

  async findAll(query = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const prices = await Price.find(query)
      .populate({
        path: 'productId',
        select: 'productName image unit status categoryId brandId',
        populate: [
          { path: 'categoryId', select: 'categoryName' },
          { path: 'brandId', select: 'brandName' }
        ]
      })
      .populate('storeId', 'storeName mallName')
      .sort('-lastUpdated')
      .skip(skip)
      .limit(limit);

    const total = await Price.countDocuments(query);
    return { prices, total, page, pages: Math.ceil(total / limit) };
  }

  async upsert(productId, storeId, priceData) {
    return await Price.findOneAndUpdate(
      { productId, storeId },
      { ...priceData, lastUpdated: new Date() },
      { new: true, upsert: true, runValidators: true }
    );
  }

  async delete(id) {
    return await Price.findByIdAndDelete(id);
  }
}

module.exports = new PriceRepository();

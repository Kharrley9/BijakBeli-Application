const Promotion = require('../models/Promotion');

class PromotionRepository {
  async create(data) {
    return await Promotion.create(data);
  }

  async findById(id) {
    return await Promotion.findById(id)
      .populate('productId', 'productName image unit')
      .populate('storeId', 'storeName mallName logo');
  }

  async findActive(query = {}) {
    const now = new Date();
    const finalQuery = {
      ...query,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };
    return await Promotion.find(finalQuery)
      .populate('productId', 'productName image unit')
      .populate('storeId', 'storeName mallName logo')
      .sort('-discountPercentage');
  }

  async findByProduct(productId) {
    const now = new Date();
    return await Promotion.find({
      productId,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('storeId', 'storeName mallName logo')
      .sort('promotionPrice');
  }

  async findAll(query = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const promotions = await Promotion.find(query)
      .populate('productId', 'productName image unit')
      .populate('storeId', 'storeName mallName logo')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Promotion.countDocuments(query);
    return { promotions, total, page, pages: Math.ceil(total / limit) };
  }

  async update(id, data) {
    return await Promotion.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('productId', 'productName image')
      .populate('storeId', 'storeName mallName');
  }

  async delete(id) {
    return await Promotion.findByIdAndDelete(id);
  }

  async count(query = {}) {
    return await Promotion.countDocuments(query);
  }
}

module.exports = new PromotionRepository();

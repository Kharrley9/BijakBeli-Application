const promotionRepository = require('../repositories/promotionRepository');

class PromotionService {
  async create(data) {
    // Auto-calculate discount percentage if not provided
    if (!data.discountPercentage && data.promotionPrice) {
      const Price = require('../models/Price');
      const priceDoc = await Price.findOne({ productId: data.productId, storeId: data.storeId });
      if (priceDoc) {
        data.discountPercentage = Math.round(
          ((priceDoc.price - data.promotionPrice) / priceDoc.price) * 100
        );
      }
    }
    return await promotionRepository.create(data);
  }

  async getById(id) {
    const promo = await promotionRepository.findById(id);
    if (!promo) { const e = new Error('Promotion not found'); e.statusCode = 404; throw e; }
    return promo;
  }

  async getActivePromotions(query = {}) {
    return await promotionRepository.findActive(query);
  }

  async getPromotionsByProduct(productId) {
    return await promotionRepository.findByProduct(productId);
  }

  async getAllPromotions(query, options) {
    return await promotionRepository.findAll(query, options);
  }

  async update(id, data) {
    return await promotionRepository.update(id, data);
  }

  async delete(id) {
    return await promotionRepository.delete(id);
  }

  async getBestDeals(query = {}, limit = 10) {
    const active = await promotionRepository.findActive(query);
    // Sort by discount descending
    active.sort((a, b) => b.discountPercentage - a.discountPercentage);
    return active.slice(0, limit);
  }

  async getPromotionCount() {
    const now = new Date();
    return await promotionRepository.count({
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
  }
}

module.exports = new PromotionService();

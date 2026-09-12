const PriceAlert = require('../models/PriceAlert');

class PriceAlertRepository {
  async upsert(userId, productId, targetPrice) {
    return await PriceAlert.findOneAndUpdate(
      { userId, productId },
      { targetPrice, active: true, triggeredAt: null, triggeredPrice: null },
      { new: true, upsert: true, runValidators: true }
    );
  }

  async remove(userId, productId) {
    return await PriceAlert.findOneAndDelete({ userId, productId });
  }

  async findByUser(userId) {
    return await PriceAlert.find({ userId })
      .populate('productId', 'productName image unit storeCategory')
      .sort('-createdAt');
  }

  async findActiveForProduct(productId) {
    return await PriceAlert.find({ productId, active: true }).populate('productId', 'productName');
  }

  async markTriggered(id, price) {
    return await PriceAlert.findByIdAndUpdate(id, {
      active: false,
      triggeredAt: new Date(),
      triggeredPrice: price,
    });
  }
}

module.exports = new PriceAlertRepository();

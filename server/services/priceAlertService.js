const priceAlertRepository = require('../repositories/priceAlertRepository');
const notificationService = require('./notificationService');

function bad(message, code = 400) {
  const e = new Error(message);
  e.statusCode = code;
  return e;
}

class PriceAlertService {
  async setAlert(userId, productId, targetPrice) {
    const t = Number(targetPrice);
    if (!Number.isFinite(t) || t <= 0) throw bad('Enter a valid target price');
    return priceAlertRepository.upsert(userId, productId, t);
  }

  async removeAlert(userId, productId) {
    return priceAlertRepository.remove(userId, productId);
  }

  async listMine(userId) {
    return priceAlertRepository.findByUser(userId);
  }

  /**
   * Fired whenever a product's price changes at a store. Notifies (and
   * deactivates) any active alert whose target has been met or beaten.
   */
  async checkAndNotify(productId, storeName, newPrice) {
    if (newPrice == null) return;
    const alerts = await priceAlertRepository.findActiveForProduct(productId);
    for (const alert of alerts) {
      if (newPrice <= alert.targetPrice) {
        await priceAlertRepository.markTriggered(alert._id, newPrice);
        notificationService
          .create(
            alert.userId,
            'Price drop!',
            `${alert.productId?.productName || 'A product'} is now RM${newPrice.toFixed(2)} at ${storeName} (your target was RM${alert.targetPrice.toFixed(2)})`
          )
          .catch(() => {});
      }
    }
  }
}

module.exports = new PriceAlertService();

const priceRepository = require('../repositories/priceRepository');
const promotionRepository = require('../repositories/promotionRepository');
const storeRepository = require('../repositories/storeRepository');

class PriceComparisonService {
  async comparePrices(productId) {
    // Get all prices for this product across stores
    const prices = await priceRepository.findByProduct(productId);

    // Get active promotions for this product
    const promotions = await promotionRepository.findByProduct(productId);

    if (!prices.length) {
      return { comparisons: [], cheapestStore: null, savings: 0 };
    }

    // Build comparison data
    const comparisons = prices.map((priceEntry) => {
      const store = priceEntry.storeId;
      const promotion = promotions.find(
        (p) => p.storeId._id.toString() === store._id.toString()
      );

      const effectivePrice = promotion ? promotion.promotionPrice : priceEntry.price;
      const priceDifference = priceEntry.previousPrice
        ? priceEntry.previousPrice - priceEntry.price
        : 0;

      return {
        store: {
          _id: store._id,
          storeName: store.storeName,
          mallName: store.mallName,
          logo: store.logo,
        },
        currentPrice: priceEntry.price,
        previousPrice: priceEntry.previousPrice,
        effectivePrice,
        priceDifference,
        promotion: promotion
          ? {
              title: promotion.promotionTitle,
              type: promotion.promotionType,
              promotionPrice: promotion.promotionPrice,
              discountPercentage: promotion.discountPercentage,
              endDate: promotion.endDate,
            }
          : null,
        hasPromotion: !!promotion,
      };
    });

    // Sort by effective price (cheapest first)
    comparisons.sort((a, b) => a.effectivePrice - b.effectivePrice);

    // Mark cheapest and best promotion
    if (comparisons.length > 0) {
      comparisons[0].isLowestPrice = true;

      const bestPromo = comparisons
        .filter((c) => c.hasPromotion)
        .sort((a, b) => (b.promotion?.discountPercentage || 0) - (a.promotion?.discountPercentage || 0))[0];

      if (bestPromo) {
        const idx = comparisons.findIndex(
          (c) => c.store._id.toString() === bestPromo.store._id.toString()
        );
        if (idx >= 0) comparisons[idx].isBestPromotion = true;
      }
    }

    // Calculate max savings
    const maxPrice = Math.max(...comparisons.map((c) => c.effectivePrice));
    const minPrice = Math.min(...comparisons.map((c) => c.effectivePrice));
    const savings = maxPrice - minPrice;

    return {
      comparisons,
      cheapestStore: comparisons[0]?.store || null,
      savings: parseFloat(savings.toFixed(2)),
      lowestPrice: minPrice,
      highestPrice: maxPrice,
    };
  }

  async updatePrice(productId, storeId, price) {
    // Get current price to store as previousPrice
    const currentPrice = await priceRepository.findByProductAndStore(productId, storeId);
    const previousPrice = currentPrice ? currentPrice.price : null;

    return await priceRepository.upsert(productId, storeId, {
      price,
      previousPrice,
    });
  }

  async getAllPrices(query, options) {
    return await priceRepository.findAll(query, options);
  }

  async deletePrice(id) {
    return await priceRepository.delete(id);
  }
}

module.exports = new PriceComparisonService();

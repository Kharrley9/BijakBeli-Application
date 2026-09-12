const priceRepository = require('../repositories/priceRepository');
const promotionRepository = require('../repositories/promotionRepository');
const storeRepository = require('../repositories/storeRepository');
const geoService = require('./geoService');
const priceAlertService = require('./priceAlertService');

class PriceComparisonService {
  async comparePrices(productId, preferredStores = [], origin = null) {
    // Get all prices for this product across stores
    let prices = await priceRepository.findByProduct(productId);
    
    if (preferredStores && preferredStores.length > 0) {
      prices = prices.filter(p => preferredStores.includes(p.storeId._id.toString()));
    }

    // Get active promotions for this product
    const promotions = await promotionRepository.findByProduct(productId);

    if (!prices.length) {
      return { comparisons: [], cheapestStore: null, nearestStore: null, savings: 0 };
    }

    // Travel distance from the trader's origin to each store (optional)
    let distanceMap = new Map();
    if (origin && geoService.isValidCoord(origin)) {
      const storeDocs = prices
        .map((p) => p.storeId)
        .filter((s) => s && s.location);
      distanceMap = await geoService.getStoreDistances(origin, storeDocs);
    }

    // Build comparison data
    const comparisons = prices.map((priceEntry) => {
      const store = priceEntry.storeId;
      const dist = distanceMap.get(String(store._id));
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
          city: store.city,
          state: store.state,
          kind: store.kind,
          storeCategory: store.storeCategory,
          rating: store.rating,
          reviewCount: store.reviewCount,
          deliveryAvailable: !!store.deliveryAvailable,
          deliveryFee: store.deliveryFee || 0,
          pickupAvailable: store.pickupAvailable !== false,
          phone: store.phone,
          orderable: store.kind === 'merchant',
          distanceKm: dist ? dist.distanceKm : null,
          durationMin: dist ? dist.durationMin : null,
          distanceSource: dist ? dist.source : null,
        },
        currentPrice: priceEntry.price,
        previousPrice: priceEntry.previousPrice,
        stock: priceEntry.stock,
        inStock: priceEntry.inStock !== false,
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

    // Nearest store among those that carry this product (if origin supplied)
    let nearestStore = null;
    const withDistance = comparisons.filter(
      (c) => typeof c.store.distanceKm === 'number'
    );
    if (withDistance.length > 0) {
      nearestStore = withDistance.reduce((a, b) =>
        b.store.distanceKm < a.store.distanceKm ? b : a
      ).store;
      const nid = String(nearestStore._id);
      comparisons.forEach((c) => {
        c.isNearest = String(c.store._id) === nid;
      });
    }

    // Calculate max savings
    const maxPrice = Math.max(...comparisons.map((c) => c.effectivePrice));
    const minPrice = Math.min(...comparisons.map((c) => c.effectivePrice));
    const savings = maxPrice - minPrice;

    return {
      comparisons,
      cheapestStore: comparisons[0]?.store || null,
      nearestStore,
      savings: parseFloat(savings.toFixed(2)),
      lowestPrice: minPrice,
      highestPrice: maxPrice,
    };
  }

  async updatePrice(productId, storeId, data) {
    // Get current price to store as previousPrice
    const currentPrice = await priceRepository.findByProductAndStore(productId, storeId);
    const previousPrice = currentPrice ? currentPrice.price : null;

    const payload = {
      price: data.price,
      previousPrice,
    };
    if (data.inStock !== undefined) payload.inStock = data.inStock;
    if (data.stock !== undefined) payload.stock = data.stock;
    if (data.sku !== undefined) payload.sku = data.sku;

    const updated = await priceRepository.upsert(productId, storeId, payload);
    if (data.price != null) {
      const store = await storeRepository.findById(storeId);
      priceAlertService.checkAndNotify(productId, store?.storeName || 'a store', data.price).catch(() => {});
    }
    return updated;
  }

  async getAllPrices(query, options) {
    return await priceRepository.findAll(query, options);
  }

  async deletePrice(id) {
    return await priceRepository.delete(id);
  }
}

module.exports = new PriceComparisonService();

const priceRepository = require('../repositories/priceRepository');
const promotionRepository = require('../repositories/promotionRepository');
const geoService = require('./geoService');

class PriceComparisonService {
  /**
   * @param {string} productId
   * @param {string[]} [preferredStores]
   * @param {{lat:number,lng:number}|null} [origin] buyer location; enables distance + travel cost
   * @param {string} [vehicle] 'car' | 'motorcycle', for the fuel-cost estimate
   */
  async comparePrices(productId, preferredStores = [], origin = null, vehicle = 'car') {
    const fuel = geoService.fuelAssumptions(vehicle);

    // Get all prices for this product across stores
    // Skip prices whose store was removed or deactivated (e.g. no longer reports to PriceCatcher)
    let prices = (await priceRepository.findByProduct(productId)).filter(
      (p) => p.storeId && p.storeId.isActive !== false
    );

    if (preferredStores && preferredStores.length > 0) {
      prices = prices.filter(p => preferredStores.includes(p.storeId._id.toString()));
    }

    // Get active promotions for this product
    const promotions = await promotionRepository.findByProduct(productId);

    if (!prices.length) {
      return {
        comparisons: [],
        cheapestStore: null,
        nearestStore: null,
        bestValueStore: null,
        savings: 0,
        fuel,
      };
    }

    // Travel distance from the buyer's origin to each store (optional)
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

      // Round-trip fuel to this store, and what the trip really costs overall
      const travelCost = dist ? geoService.travelCostRm(dist.roadKm, fuel) : null;
      const totalCost =
        travelCost != null ? Math.round((effectivePrice + travelCost) * 100) / 100 : null;

      return {
        store: {
          _id: store._id,
          storeName: store.storeName,
          mallName: store.mallName,
          logo: store.logo,
          city: store.city,
          state: store.state,
          phone: store.phone,
          distanceKm: dist ? dist.distanceKm : null,
          durationMin: dist ? dist.durationMin : null,
          distanceSource: dist ? dist.source : null,
        },
        currentPrice: priceEntry.price,
        previousPrice: priceEntry.previousPrice,
        lastUpdated: priceEntry.lastUpdated,
        inStock: priceEntry.inStock !== false,
        effectivePrice,
        travelCost,
        totalCost,
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

    // "Cheapest" means cheapest the buyer could reasonably go to: stores within
    // the nearby radius when we know where they are (and there are any), else all.
    // The nationwide lowest is still available from GET /prices/lowest/:productId.
    const nearby = geoService.withinNearbyRadius(comparisons);
    const pool = nearby.length ? nearby : comparisons;
    const scope = nearby.length ? 'nearby' : 'all';

    // Mark cheapest and best promotion
    if (pool.length > 0) {
      pool[0].isLowestPrice = true;

      const bestPromo = pool
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

    // Best value: lowest item price + round-trip fuel, among in-stock stores.
    // Only meaningful when we know where the buyer is.
    let bestValueStore = null;
    const withTotal = comparisons.filter((c) => c.totalCost != null && c.inStock);
    if (withTotal.length > 0) {
      const best = withTotal.reduce((a, b) => (b.totalCost < a.totalCost ? b : a));
      bestValueStore = best.store;
      comparisons.forEach((c) => {
        c.isBestValue = c === best;
      });
    }

    // Calculate max savings (within the same pool as "cheapest")
    const maxPrice = Math.max(...pool.map((c) => c.effectivePrice));
    const minPrice = Math.min(...pool.map((c) => c.effectivePrice));
    const savings = maxPrice - minPrice;

    // Newest price date, shown with the PriceCatcher credit (CC BY 4.0 requires attribution)
    const dates = comparisons.map((c) => c.lastUpdated).filter(Boolean).map((d) => new Date(d).getTime());
    const dataAsOf = dates.length ? new Date(Math.max(...dates)) : null;

    return {
      comparisons,
      cheapestStore: pool[0]?.store || null,
      nearestStore,
      bestValueStore,
      savings: parseFloat(savings.toFixed(2)),
      lowestPrice: minPrice,
      highestPrice: maxPrice,
      // 'nearby': cheapest/lowest/savings are among stores within nearbyRadiusKm
      priceScope: scope,
      nearbyRadiusKm: geoService.NEARBY_RADIUS_KM,
      nearbyStoreCount: nearby.length,
      fuel,
      dataAsOf,
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

    return await priceRepository.upsert(productId, storeId, payload);
  }

  async getAllPrices(query, options) {
    return await priceRepository.findAll(query, options);
  }

  async deletePrice(id) {
    return await priceRepository.delete(id);
  }
}

module.exports = new PriceComparisonService();

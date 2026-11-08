const priceRepository = require('../repositories/priceRepository');
const promotionRepository = require('../repositories/promotionRepository');
const geoService = require('./geoService');

class PriceComparisonService {
  /**
   * @param {string} productId
   * @param {string[]} [preferredStores]
   * @param {{lat:number,lng:number}|null} [origin] buyer location; enables distance + travel cost
   * @param {string} [vehicle] 'car' | 'motorcycle', for the fuel-cost estimate
   * @param {number} [radiusKm] only stores this close to `origin` are compared
   */
  async comparePrices(
    productId,
    preferredStores = [],
    origin = null,
    vehicle = 'car',
    radiusKm = geoService.NEARBY_RADIUS_KM
  ) {
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

    // When we know where the buyer is, only stores within their chosen radius
    // count: the list, cheapest, nearest, best value and savings all come from
    // those. The closest store beyond the radius is reported so the app can
    // suggest widening it. Without a location, every store is compared.
    const located = distanceMap.size > 0;
    const rows = located ? geoService.withinNearbyRadius(comparisons, radiusKm) : comparisons;
    const beyond = located
      ? comparisons.filter((c) => !rows.includes(c) && typeof c.store.distanceKm === 'number')
      : [];
    const nearestBeyond = beyond.length
      ? beyond.reduce((a, b) => (b.store.distanceKm < a.store.distanceKm ? b : a)).store
      : null;

    // Mark cheapest and best promotion
    if (rows.length > 0) {
      rows[0].isLowestPrice = true;

      const bestPromo = rows
        .filter((c) => c.hasPromotion)
        .sort((a, b) => (b.promotion?.discountPercentage || 0) - (a.promotion?.discountPercentage || 0))[0];
      if (bestPromo) bestPromo.isBestPromotion = true;
    }

    // Nearest store among those that carry this product
    let nearestStore = null;
    const withDistance = rows.filter((c) => typeof c.store.distanceKm === 'number');
    if (withDistance.length > 0) {
      const nearest = withDistance.reduce((a, b) => (b.store.distanceKm < a.store.distanceKm ? b : a));
      nearestStore = nearest.store;
      rows.forEach((c) => {
        c.isNearest = c === nearest;
      });
    }

    // Best value: lowest item price + round-trip fuel, among in-stock stores.
    let bestValueStore = null;
    const withTotal = rows.filter((c) => c.totalCost != null && c.inStock);
    if (withTotal.length > 0) {
      const best = withTotal.reduce((a, b) => (b.totalCost < a.totalCost ? b : a));
      bestValueStore = best.store;
      rows.forEach((c) => {
        c.isBestValue = c === best;
      });
    }

    const effective = rows.map((c) => c.effectivePrice);
    const maxPrice = effective.length ? Math.max(...effective) : null;
    const minPrice = effective.length ? Math.min(...effective) : null;
    const savings = effective.length ? maxPrice - minPrice : 0;

    // Newest price date, shown with the PriceCatcher credit (CC BY 4.0 requires attribution)
    const dates = comparisons.map((c) => c.lastUpdated).filter(Boolean).map((d) => new Date(d).getTime());
    const dataAsOf = dates.length ? new Date(Math.max(...dates)) : null;

    return {
      comparisons: rows,
      cheapestStore: rows[0]?.store || null,
      nearestStore,
      bestValueStore,
      savings: parseFloat(savings.toFixed(2)),
      lowestPrice: minPrice,
      highestPrice: maxPrice,
      // 'nearby': everything above is limited to stores within nearbyRadiusKm
      priceScope: located ? 'nearby' : 'all',
      nearbyRadiusKm: radiusKm,
      nearbyStoreCount: located ? rows.length : 0,
      storesBeyondRadius: beyond.length,
      nearestBeyond,
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

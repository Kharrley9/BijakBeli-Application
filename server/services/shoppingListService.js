const shoppingListRepository = require('../repositories/shoppingListRepository');
const priceRepository = require('../repositories/priceRepository');
const storeRepository = require('../repositories/storeRepository');
const geoService = require('./geoService');

class ShoppingListService {
  async createList(userId, title) {
    return await shoppingListRepository.createList({ userId, title });
  }

  async getUserLists(userId) {
    return await shoppingListRepository.findListsByUser(userId);
  }

  async getListById(id) {
    const list = await shoppingListRepository.findListById(id);
    if (!list) { const e = new Error('Shopping list not found'); e.statusCode = 404; throw e; }
    return list;
  }

  async addItem(shoppingListId, productId, quantity = 1) {
    const item = await shoppingListRepository.addItem({
      shoppingListId,
      productId,
      quantity,
    });
    await this.recalculateTotal(shoppingListId);
    return item;
  }

  async updateItem(itemId, quantity) {
    const item = await shoppingListRepository.updateItem(itemId, { quantity });
    if (item) {
      await this.recalculateTotal(item.shoppingListId);
    }
    return item;
  }

  async removeItem(itemId) {
    const ShoppingListItem = require('../models/ShoppingListItem');
    const item = await ShoppingListItem.findById(itemId);
    if (item) {
      await shoppingListRepository.removeItem(itemId);
      await this.recalculateTotal(item.shoppingListId);
    }
    return item;
  }

  async deleteList(id) {
    return await shoppingListRepository.deleteList(id);
  }

  async recalculateTotal(shoppingListId, origin = null) {
    const list = await shoppingListRepository.findListById(shoppingListId);
    if (!list) return null;

    const items = await shoppingListRepository.getListItems(shoppingListId);
    
    // Fetch the user to get preferred stores
    const User = require('../models/User');
    const user = await User.findById(list.userId);
    const preferredStores = user?.preferredStores || [];

    let stores = await storeRepository.findAll();
    
    // If the user has preferred stores, only calculate against those
    if (preferredStores.length > 0) {
      stores = stores.filter(s => preferredStores.includes(s._id.toString()));
    }

    // Travel distance from the trader's origin to each candidate store (optional)
    let distanceMap = new Map();
    if (origin && geoService.isValidCoord(origin)) {
      distanceMap = await geoService.getStoreDistances(origin, stores);
    }

    let storeTotals = {};

    for (const store of stores) {
      let total = 0;
      for (const item of items) {
        const price = await priceRepository.findByProductAndStore(
          item.productId._id || item.productId,
          store._id
        );
        if (price) {
          total += price.price * item.quantity;
        }
      }
      const dist = distanceMap.get(String(store._id));
      storeTotals[store._id] = {
        store: {
          _id: store._id,
          storeName: store.storeName,
          mallName: store.mallName,
          distanceKm: dist ? dist.distanceKm : null,
          durationMin: dist ? dist.durationMin : null,
        },
        total: parseFloat(total.toFixed(2)),
      };
    }

    // Nearest store that actually has at least one item priced
    let nearestStore = null;
    const priced = Object.values(storeTotals).filter(
      (s) => s.total > 0 && typeof s.store.distanceKm === 'number'
    );
    if (priced.length > 0) {
      nearestStore = priced.reduce((a, b) =>
        b.store.distanceKm < a.store.distanceKm ? b : a
      );
    }

    // Find cheapest
    const cheapest = Object.values(storeTotals).reduce(
      (min, s) => (s.total > 0 && s.total < min.total ? s : min),
      { total: Infinity }
    );

    const mostExpensive = Object.values(storeTotals).reduce(
      (max, s) => (s.total > max.total ? s : max),
      { total: 0 }
    );

    const estimatedSaving = parseFloat(
      (mostExpensive.total - cheapest.total).toFixed(2)
    );

    await shoppingListRepository.updateList(shoppingListId, {
      totalPrice: cheapest.total === Infinity ? 0 : cheapest.total,
      estimatedSaving: estimatedSaving > 0 ? estimatedSaving : 0,
    });

    return {
      storeTotals: Object.values(storeTotals),
      cheapestStore: cheapest,
      nearestStore,
      estimatedSaving,
    };
  }

  async compareStores(shoppingListId, origin = null) {
    return await this.recalculateTotal(shoppingListId, origin);
  }
}

module.exports = new ShoppingListService();

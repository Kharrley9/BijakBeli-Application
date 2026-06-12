const shoppingListRepository = require('../repositories/shoppingListRepository');
const priceRepository = require('../repositories/priceRepository');
const storeRepository = require('../repositories/storeRepository');

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

  async recalculateTotal(shoppingListId) {
    const items = await shoppingListRepository.getListItems(shoppingListId);
    const stores = await storeRepository.findAll();

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
      storeTotals[store._id] = {
        store: { _id: store._id, storeName: store.storeName, mallName: store.mallName },
        total: parseFloat(total.toFixed(2)),
      };
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

    return { storeTotals: Object.values(storeTotals), cheapestStore: cheapest, estimatedSaving };
  }

  async compareStores(shoppingListId) {
    return await this.recalculateTotal(shoppingListId);
  }
}

module.exports = new ShoppingListService();

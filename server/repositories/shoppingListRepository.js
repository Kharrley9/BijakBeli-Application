const ShoppingList = require('../models/ShoppingList');
const ShoppingListItem = require('../models/ShoppingListItem');

class ShoppingListRepository {
  async createList(data) {
    return await ShoppingList.create(data);
  }

  async findListById(id) {
    return await ShoppingList.findById(id).populate({
      path: 'items',
      populate: {
        path: 'productId',
        select: 'productName image unit',
      },
    });
  }

  async findListsByUser(userId) {
    return await ShoppingList.find({ userId }).sort('-createdAt');
  }

  async updateList(id, data) {
    return await ShoppingList.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteList(id) {
    await ShoppingListItem.deleteMany({ shoppingListId: id });
    return await ShoppingList.findByIdAndDelete(id);
  }

  async addItem(data) {
    return await ShoppingListItem.create(data);
  }

  async updateItem(itemId, data) {
    return await ShoppingListItem.findByIdAndUpdate(itemId, data, { new: true });
  }

  async removeItem(itemId) {
    return await ShoppingListItem.findByIdAndDelete(itemId);
  }

  async getListItems(shoppingListId) {
    return await ShoppingListItem.find({ shoppingListId })
      .populate('productId', 'productName image unit');
  }
}

module.exports = new ShoppingListRepository();

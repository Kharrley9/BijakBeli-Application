const mongoose = require('mongoose');

const shoppingListItemSchema = new mongoose.Schema(
  {
    shoppingListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShoppingList',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ShoppingListItem', shoppingListItemSchema);

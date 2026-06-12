const mongoose = require('mongoose');

const purchaseHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shoppingListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShoppingList',
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalSaving: {
      type: Number,
      default: 0,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PurchaseHistory', purchaseHistorySchema);

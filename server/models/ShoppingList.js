const mongoose = require('mongoose');

const shoppingListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    estimatedSaving: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

shoppingListSchema.virtual('items', {
  ref: 'ShoppingListItem',
  localField: '_id',
  foreignField: 'shoppingListId',
});

module.exports = mongoose.model('ShoppingList', shoppingListSchema);

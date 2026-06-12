const mongoose = require('mongoose');

const favoriteProductSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

favoriteProductSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('FavoriteProduct', favoriteProductSchema);

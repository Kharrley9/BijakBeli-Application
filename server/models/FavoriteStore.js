const mongoose = require('mongoose');

const favoriteStoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  },
  { timestamps: true }
);

favoriteStoreSchema.index({ userId: 1, storeId: 1 }, { unique: true });

module.exports = mongoose.model('FavoriteStore', favoriteStoreSchema);

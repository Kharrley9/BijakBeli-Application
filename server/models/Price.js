const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    previousPrice: {
      type: Number,
      default: null,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    // Real quantity for merchant listings; null = unknown (chains).
    stock: {
      type: Number,
      default: null,
      min: 0,
    },
    // Merchant's internal code (optional).
    sku: {
      type: String,
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one price per product per store
priceSchema.index({ productId: 1, storeId: 1 }, { unique: true });

module.exports = mongoose.model('Price', priceSchema);

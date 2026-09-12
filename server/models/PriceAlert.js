const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    targetPrice: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    triggeredAt: { type: Date, default: null },
    triggeredPrice: { type: Number, default: null },
  },
  { timestamps: true }
);

priceAlertSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('PriceAlert', priceAlertSchema);

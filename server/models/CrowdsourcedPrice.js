const mongoose = require('mongoose');

/**
 * CrowdsourcedPrice — stores user-submitted price observations (JOM Kongsi equivalent).
 * These are separate from admin-verified Price records.
 */
const crowdsourcedPriceSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    // Optional promo info (user can also report a promo price)
    isPromo: {
      type: Boolean,
      default: false,
    },
    promoDescription: {
      type: String,
      default: null,
      maxlength: 200,
    },
    // Photo evidence (optional, base64 or upload path)
    photoUrl: {
      type: String,
      default: null,
    },
    // Moderation
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    // How many other users confirmed / disputed this price
    confirmations: { type: Number, default: 0 },
    disputes:      { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Index for fast "latest price reports for a product" lookups
crowdsourcedPriceSchema.index({ productId: 1, createdAt: -1 });
crowdsourcedPriceSchema.index({ storeId: 1, productId: 1 });

module.exports = mongoose.model('CrowdsourcedPrice', crowdsourcedPriceSchema);

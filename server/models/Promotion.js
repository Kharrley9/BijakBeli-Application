const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
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
    promotionTitle: {
      type: String,
      required: [true, 'Please add a promotion title'],
      trim: true,
    },
    promotionType: {
      type: String,
      enum: ['discount', 'buy1free1', 'bundle', 'clearance', 'seasonal', 'member'],
      required: true,
    },
    promotionPrice: {
      type: Number,
      required: [true, 'Please add a promotion price'],
      min: 0,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
      required: [true, 'Please add a start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please add an end date'],
    },
    promotionBanner: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

promotionSchema.index({ endDate: 1 });
promotionSchema.index({ productId: 1, storeId: 1 });

module.exports = mongoose.model('Promotion', promotionSchema);

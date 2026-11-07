const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    // ── Price Catcher / data.gov.my fields ──────────────────────────────
    itemCode: {
      type: Number,
      default: null,
      index: true,
    },
    itemGroup: {
      type: String,
      default: null,
      trim: true,
    },
    itemCategory: {
      type: String,
      default: null,
      trim: true,
    },
    isOfficialItem: {
      type: Boolean,
      default: false,
    },
    // True when scripts/importPriceCatcher.js hid this item because no store
    // in our chains reported a price for it; the next import re-shows it once
    // prices appear. Items hidden for other reasons never get this flag.
    noPriceData: {
      type: Boolean,
      default: false,
    },
    productName: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      maxlength: [200, 'Product name cannot be more than 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please add a category'],
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    image: {
      type: String,
      default: '',
    },
    unit: {
      type: String,
      required: [true, 'Please add a unit'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text index for search (include itemGroup / itemCategory for better results)
productSchema.index({ productName: 'text', description: 'text', itemGroup: 'text', itemCategory: 'text' });

// Virtual for prices
productSchema.virtual('prices', {
  ref: 'Price',
  localField: '_id',
  foreignField: 'productId',
});

module.exports = mongoose.model('Product', productSchema);

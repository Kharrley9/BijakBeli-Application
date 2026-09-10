const mongoose = require('mongoose');
const { STORE_CATEGORY_SLUGS } = require('../config/constants');

const productSchema = new mongoose.Schema(
  {
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
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
    // Denormalised from the category's group for fast filtering / search.
    storeCategory: {
      type: String,
      enum: STORE_CATEGORY_SLUGS,
      default: 'grocery',
      index: true,
    },
    // Optional — automotive / hardware items often have no catalogue brand.
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    // null = shared catalogue (seeded by admin); set = merchant-created product.
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    image: {
      type: String,
      default: '',
    },
    // Free-text unit (kg, L, pcs, set, roll, metre, ...). Suggestions live on the client.
    unit: {
      type: String,
      required: [true, 'Please add a unit'],
      trim: true,
    },
    // Category-specific extra fields (part number, size, wattage, ...).
    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

// Text index for search
productSchema.index({ productName: 'text', description: 'text' });

// Virtual for prices
productSchema.virtual('prices', {
  ref: 'Price',
  localField: '_id',
  foreignField: 'productId',
});

module.exports = mongoose.model('Product', productSchema);

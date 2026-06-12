const mongoose = require('mongoose');

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
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Please add a brand'],
    },
    image: {
      type: String,
      default: '',
    },
    unit: {
      type: String,
      required: [true, 'Please add a unit'],
      enum: ['kg', 'g', 'L', 'ml', 'pcs', 'pack', 'box', 'bottle', 'can', 'bag', 'unit'],
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

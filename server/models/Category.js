const mongoose = require('mongoose');
const { STORE_CATEGORY_SLUGS } = require('../config/constants');

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
    },
    // Which top-level store category this product category belongs to.
    group: {
      type: String,
      enum: STORE_CATEGORY_SLUGS,
      default: 'grocery',
      index: true,
    },
    icon: {
      type: String,
      default: 'pricetag-outline',
    },
    order: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Category', categorySchema);

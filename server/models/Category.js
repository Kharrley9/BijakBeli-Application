const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
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

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
    },
    // Malay is the primary name (categoryName, matching Price Catcher); the app
    // can switch to this English name in Settings.
    nameEn: {
      type: String,
      trim: true,
      default: '',
    },
    icon: {
      type: String,
      default: 'pricetag-outline',
    },
    emoji: {
      type: String,
      default: '🛒',
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

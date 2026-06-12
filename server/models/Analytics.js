const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    mostComparedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    mostVisitedStore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    dailyVisitors: {
      type: Number,
      default: 0,
    },
    monthlySavings: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Analytics', analyticsSchema);

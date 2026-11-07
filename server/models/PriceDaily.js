const mongoose = require('mongoose');

/**
 * One day of real prices for one item, summarised across the app's chain stores.
 * Built by scripts/importPriceCatcher.js from PriceCatcher (KPDN, data.gov.my)
 * observations, and read by GET /api/prices/trend/:productId for the trend chart.
 *
 * Stored as daily summaries instead of every observation (~240k per two months)
 * to stay small on a free MongoDB tier.
 */
const statSchema = new mongoose.Schema(
  {
    median: Number,
    min: Number,
    max: Number,
    count: Number, // number of observations that day
  },
  { _id: false }
);

const priceDailySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD', Malaysian date as published
    ...statSchema.obj,
    byState: [
      new mongoose.Schema({ state: String, ...statSchema.obj }, { _id: false }),
    ],
  },
  { timestamps: true }
);

priceDailySchema.index({ productId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PriceDaily', priceDailySchema);

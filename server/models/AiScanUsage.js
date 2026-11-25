const mongoose = require('mongoose');

/**
 * How many photo scans (Gemini requests) were made on one Gemini "day".
 * Gemini's free-tier daily quota resets at midnight Pacific time, so `day` is the
 * Pacific-time date (YYYY-MM-DD). Kept in the database so a server restart does
 * not forget what was already used.
 */
const aiScanUsageSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    // Set when Gemini itself answered "daily quota exhausted" before our count got there
    exhausted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AiScanUsage', aiScanUsageSchema);

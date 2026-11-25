const mongoose = require('mongoose');

/**
 * A store barcode that buyers have linked to one of our products.
 *
 * PriceCatcher has no barcodes for fresh produce, so buyers teach the app: the
 * first scan of an unknown barcode asks which item it is, and later scans go
 * straight to that item's prices. Every buyer has one vote per barcode; the
 * product with the most votes wins (a buyer's own vote wins for that buyer), so
 * one wrong link can be outvoted instead of sticking forever.
 */
const voteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const barcodeLinkSchema = new mongoose.Schema(
  {
    // Normalised key from services/scanService.normaliseBarcode, e.g.
    // "B:9556789012345" (retail EAN) or "W:2101234" (store scale label, price part cut off)
    code: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    kind: { type: String, enum: ['retail', 'weighed', 'other'], required: true },
    // One raw scan, for debugging normalisation
    sample: { type: String, maxlength: 80 },
    votes: { type: [voteSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BarcodeLink', barcodeLinkSchema);

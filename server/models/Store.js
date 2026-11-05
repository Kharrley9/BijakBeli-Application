const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: [true, 'Please add a store name'],
      trim: true,
    },
    mallName: {
      type: String,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['hypermarket', 'supermarket', 'minimart', 'convenience store', 'independent'],
      default: 'supermarket',
    },
    phone: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    bannerImage: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'draft', 'suspended'],
      default: 'active',
    },
    operating_hours: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'Please add a state'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please add a city'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    logo: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // ── Price Catcher / data.gov.my ─────────────────────────────────────
    // Set for stores imported by scripts/importPriceCatcher.js; null otherwise.
    premiseCode: {
      type: Number,
      default: undefined,
    },
    // How the coordinates were found: the store itself on OpenStreetMap,
    // its postcode area, or only its district (least precise).
    geoPrecision: {
      type: String,
      enum: ['premise', 'postcode', 'district', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ storeName: 'text' });
storeSchema.index({ premiseCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Store', storeSchema);

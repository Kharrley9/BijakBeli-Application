const mongoose = require('mongoose');
const { STORE_CATEGORY_SLUGS, STORE_KINDS } = require('../config/constants');

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

    // v2 marketplace fields
    kind: {
      type: String,
      enum: STORE_KINDS,
      default: 'chain',
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    storeCategory: {
      type: String,
      enum: STORE_CATEGORY_SLUGS,
      default: 'grocery',
      index: true,
    },
    phone: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    bannerImage: { type: String, default: '' },
    deliveryAvailable: { type: Boolean, default: false },
    deliveryFee: { type: Number, default: 0, min: 0 },
    pickupAvailable: { type: Boolean, default: true },
    minOrder: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
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
  },
  {
    timestamps: true,
  }
);

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ storeName: 'text' });

// A trader store is orderable; a chain is comparison-only.
storeSchema.virtual('orderable').get(function () {
  return this.kind === 'merchant';
});

module.exports = mongoose.model('Store', storeSchema);

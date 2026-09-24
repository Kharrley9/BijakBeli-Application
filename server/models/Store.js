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
  },
  {
    timestamps: true,
  }
);

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ storeName: 'text' });

module.exports = mongoose.model('Store', storeSchema);

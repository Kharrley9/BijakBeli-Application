const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    applicationName: {
      type: String,
      default: 'BijakBeli',
    },
    logo: {
      type: String,
      default: '',
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);

const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: [true, 'Please add a brand name'],
      unique: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Brand', brandSchema);

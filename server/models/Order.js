const mongoose = require('mongoose');
const { ORDER_STATUSES } = require('../config/constants');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    unit: { type: String },
    unitPrice: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },

    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    fulfilment: { type: String, enum: ['pickup', 'delivery'], required: true },
    deliveryAddress: {
      label: String,
      line: String,
      city: String,
      state: String,
    },
    contactPhone: { type: String, trim: true },
    paymentMethod: { type: String, enum: ['cod', 'pay_at_pickup'], required: true },

    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: { type: [statusEventSchema], default: [] },
    cancelledBy: { type: String, enum: ['buyer', 'merchant', null], default: null },

    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

orderSchema.index({ storeId: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });

orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.orderNumber = `BB-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

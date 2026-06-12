const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monthlyBudget: {
      type: Number,
      required: [true, 'Please set a monthly budget'],
      min: [0, 'Budget cannot be negative'],
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

budgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

// Auto-calculate remaining
budgetSchema.pre('save', function (next) {
  this.remainingAmount = this.monthlyBudget - this.spentAmount;
  next();
});

module.exports = mongoose.model('Budget', budgetSchema);

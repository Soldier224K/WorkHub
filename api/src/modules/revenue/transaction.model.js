const mongoose = require('mongoose');
const { TRANSACTION_TYPES } = require('../../config/constants');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    refs: {
      booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
      },
      pass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pass',
      },
      amenity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Amenity',
      },
    },
    period: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ type: 1, createdAt: -1 });
// Renewal idempotency index
transactionSchema.index(
  { 'refs.pass': 1, period: 1 },
  {
    unique: true,
    partialFilterExpression: {
      'refs.pass': { $exists: true },
      period: { $type: 'string' },
    },
    name: 'unique_pass_renewal_period',
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

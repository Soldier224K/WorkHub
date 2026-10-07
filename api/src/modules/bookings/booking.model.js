const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../../config/constants');

const bookingSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      required: true,
    },
    resourceModel: {
      type: String,
      default: 'Space',
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    slotKeys: {
      type: [String],
      required: true,
    },
    holding: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.CONFIRMED,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    qrToken: {
      type: String,
      default: null,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Concurrency Guarantee: Unique partial index on resource + slotKeys where holding is true
bookingSchema.index(
  { resource: 1, slotKeys: 1 },
  {
    unique: true,
    partialFilterExpression: { holding: true },
    name: 'unique_resource_holding_slotkeys',
  }
);

bookingSchema.index({ member: 1, start: -1 });
bookingSchema.index({ status: 1, start: 1 });
bookingSchema.index(
  { member: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
    name: 'unique_member_idempotency_key',
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

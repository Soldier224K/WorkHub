const mongoose = require('mongoose');
const { PASS_PLANS, PASS_STATUS } = require('../../config/constants');

const passSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    plan: {
      type: String,
      enum: Object.values(PASS_PLANS),
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    renewDay: {
      type: Number,
      default: 1,
      min: 1,
      max: 31,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: Object.values(PASS_STATUS),
      default: PASS_STATUS.ACTIVE,
    },
    nextRenewalAt: {
      type: Date,
      required: true,
    },
    lastRenewedPeriod: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique active pass per member
passSchema.index(
  { member: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: PASS_STATUS.ACTIVE },
    name: 'unique_active_pass_per_member',
  }
);

passSchema.index({ nextRenewalAt: 1 });

const Pass = mongoose.model('Pass', passSchema);

module.exports = Pass;

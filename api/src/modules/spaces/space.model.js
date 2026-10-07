const mongoose = require('mongoose');
const { SPACE_TYPES } = require('../../config/constants');

const spaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(SPACE_TYPES),
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      default: 1,
    },
    capacity: {
      type: Number,
      required: true,
      default: 1,
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    operatingHours: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '20:00' },
      days: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] }, // 0 = Sun .. 6 = Sat
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    features: {
      type: [String],
      default: [],
    },
    layout: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      w: { type: Number, default: 60 },
      h: { type: Number, default: 40 },
      rot: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

spaceSchema.index({ location: 1, type: 1 });

const Space = mongoose.model('Space', spaceSchema);

module.exports = Space;

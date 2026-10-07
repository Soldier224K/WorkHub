const mongoose = require('mongoose');
const { AMENITY_KINDS } = require('../../config/constants');

const amenitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    kind: {
      type: String,
      enum: Object.values(AMENITY_KINDS),
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    units: {
      type: String,
      default: 'unit',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

amenitySchema.index({ location: 1, kind: 1 });

const Amenity = mongoose.model('Amenity', amenitySchema);

module.exports = Amenity;

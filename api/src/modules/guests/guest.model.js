const mongoose = require('mongoose');
const { GUEST_STATUS } = require('../../config/constants');

const guestSchema = new mongoose.Schema(
  {
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(GUEST_STATUS),
      default: GUEST_STATUS.INVITED,
    },
  },
  {
    timestamps: true,
  }
);

guestSchema.index({ booking: 1 });

const Guest = mongoose.model('Guest', guestSchema);

module.exports = Guest;

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('./ApiError');
const { ERROR_CODES } = require('../config/constants');

const generateBookingQrToken = (bookingId, expiresAt) => {
  return jwt.sign(
    {
      sub: String(bookingId),
      type: 'booking_checkin',
    },
    env.JWT_SECRET,
    {
      expiresIn: '7d', // Active for booking window
    }
  );
};

const generateGuestQrToken = (guestId) => {
  return jwt.sign(
    {
      sub: String(guestId),
      type: 'guest_pass',
    },
    env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

const verifyQrToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired QR token', ERROR_CODES.TOKEN_EXPIRED);
  }
};

module.exports = {
  generateBookingQrToken,
  generateGuestQrToken,
  verifyQrToken,
};

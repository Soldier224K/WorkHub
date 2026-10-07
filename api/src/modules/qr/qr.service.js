const Booking = require('../bookings/booking.model');
const ApiError = require('../../shared/ApiError');
const { BOOKING_STATUS, ERROR_CODES } = require('../../config/constants');
const { verifyQrToken } = require('../../shared/qrToken');
const { emitDeskUnlocked, emitBookingStatus } = require('../../sockets/emitters');

const checkIn = async ({ bookingId, token }) => {
  if (!token) {
    throw ApiError.badRequest('Missing QR token parameter', ERROR_CODES.VALIDATION_FAILED);
  }

  // Verify JWT signature of QR token
  const decoded = verifyQrToken(token);
  if (decoded.sub !== String(bookingId)) {
    throw ApiError.unauthorized('QR token does not match this booking', ERROR_CODES.UNAUTHORIZED);
  }

  const booking = await Booking.findById(bookingId).populate('resource');
  if (!booking) {
    throw ApiError.notFound('Booking not found', ERROR_CODES.NOT_FOUND);
  }

  // Idempotent: If already checked in, return success
  if (booking.status === BOOKING_STATUS.CHECKED_IN) {
    return {
      message: 'Already checked in',
      booking,
    };
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw ApiError.conflict(
      `Cannot check in to a booking with status '${booking.status}'`,
      ERROR_CODES.INVALID_STATE_TRANSITION
    );
  }

  booking.status = BOOKING_STATUS.CHECKED_IN;
  booking.checkedInAt = new Date();
  await booking.save();

  // Socket emissions for real-time unlock WOW effect
  emitDeskUnlocked({
    memberId: booking.member.toString(),
    bookingId: booking._id.toString(),
    spaceName: booking.resource?.name || 'Workspace',
  });

  emitBookingStatus({
    memberId: booking.member.toString(),
    bookingId: booking._id.toString(),
    status: BOOKING_STATUS.CHECKED_IN,
  });

  return {
    message: `${booking.resource?.name || 'Desk'} unlocked successfully`,
    booking,
  };
};

module.exports = {
  checkIn,
};

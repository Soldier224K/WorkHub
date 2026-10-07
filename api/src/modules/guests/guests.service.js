const mongoose = require('mongoose');
const Guest = require('./guest.model');
const Booking = require('../bookings/booking.model');
const ApiError = require('../../shared/ApiError');
const { BOOKING_STATUS, ERROR_CODES, ROLES, GUEST_STATUS } = require('../../config/constants');
const { generateGuestQrToken } = require('../../shared/qrToken');

const inviteGuest = async ({ user, bookingId, name, email }) => {
  const booking = await Booking.findById(bookingId).populate('resource');
  if (!booking) {
    throw ApiError.notFound('Booking not found', ERROR_CODES.NOT_FOUND);
  }

  if (user.role === ROLES.MEMBER && booking.member.toString() !== user.id) {
    throw ApiError.forbidden('You can only invite guests to your own bookings', ERROR_CODES.FORBIDDEN);
  }

  if (![BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN].includes(booking.status)) {
    throw ApiError.badRequest('Guests can only be invited to confirmed or checked-in bookings', ERROR_CODES.VALIDATION_FAILED);
  }

  // Check capacity limit
  const currentGuestCount = await Guest.countDocuments({
    booking: booking._id,
    status: { $ne: GUEST_STATUS.CANCELLED },
  });

  const spaceCapacity = booking.resource.capacity || 1;
  // If capacity is 1 (desk), no guests can fit
  if (currentGuestCount + 1 >= spaceCapacity && spaceCapacity <= 1) {
    throw ApiError.unprocessable(
      `Cannot invite guests: Space capacity is ${spaceCapacity}`,
      ERROR_CODES.GUEST_LIMIT
    );
  }

  if (currentGuestCount + 1 > spaceCapacity) {
    throw ApiError.unprocessable(
      `Cannot invite more guests: Maximum capacity of ${spaceCapacity} reached`,
      ERROR_CODES.GUEST_LIMIT
    );
  }

  const guestId = new mongoose.Types.ObjectId();
  const qrToken = generateGuestQrToken(guestId);

  const guest = await Guest.create({
    _id: guestId,
    invitedBy: user.id,
    booking: booking._id,
    name,
    email: email.toLowerCase(),
    qrToken,
    status: GUEST_STATUS.INVITED,
  });

  return guest;
};

const listGuests = async (user) => {
  const filter = {};
  if (user.role === ROLES.MEMBER) {
    filter.invitedBy = user.id;
  }
  return Guest.find(filter).populate('booking').sort({ createdAt: -1 });
};

const getGuestsByBooking = async (bookingId, user) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Booking not found', ERROR_CODES.NOT_FOUND);
  }

  if (user.role === ROLES.MEMBER && booking.member.toString() !== user.id) {
    throw ApiError.forbidden('Unauthorized access to booking guests', ERROR_CODES.FORBIDDEN);
  }

  return Guest.find({ booking: bookingId }).sort({ createdAt: -1 });
};

const getPublicGuestPass = async (token) => {
  const guest = await Guest.findOne({ qrToken: token })
    .populate({
      path: 'booking',
      populate: { path: 'resource' },
    })
    .populate('invitedBy', 'name email company');

  if (!guest) {
    throw ApiError.notFound('Guest pass not found or invalid token', ERROR_CODES.NOT_FOUND);
  }

  return {
    guest: {
      name: guest.name,
      email: guest.email,
      status: guest.status,
    },
    host: {
      name: guest.invitedBy?.name || 'Host',
      company: guest.invitedBy?.company || '',
    },
    booking: {
      spaceName: guest.booking?.resource?.name || 'Workspace',
      spaceType: guest.booking?.resource?.type || 'desk',
      location: guest.booking?.resource?.location || '',
      floor: guest.booking?.resource?.floor || 1,
      start: guest.booking?.start,
      end: guest.booking?.end,
      status: guest.booking?.status,
    },
    qrToken: guest.qrToken,
  };
};

module.exports = {
  inviteGuest,
  listGuests,
  getGuestsByBooking,
  getPublicGuestPass,
};

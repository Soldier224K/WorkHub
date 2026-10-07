const Booking = require('./booking.model');
const Space = require('../spaces/space.model');
const ApiError = require('../../shared/ApiError');
const { BOOKING_STATUS, ERROR_CODES, ROLES, SLOT_CONFIG } = require('../../config/constants');
const { toSlotKeys } = require('../../shared/slots');
const { isWithinOperatingHours, assertFutureTime } = require('../../shared/time');
const { generateBookingQrToken } = require('../../shared/qrToken');
const { calculatePrice } = require('./pricing.service');
const { assertTransition, shouldReleaseHolding } = require('./booking.state');
const { emitAvailability, emitBookingStatus } = require('../../sockets/emitters');
const { recordBookingPayment, recordBookingRefund } = require('../revenue/ledger.service');
const { notifyMember } = require('../notifications/notify.service');

const createBooking = async ({ memberId, resourceId, start, end, notes, idempotencyKey }) => {
  // 1. Idempotency Check: if key provided and exists, return existing
  if (idempotencyKey) {
    const existing = await Booking.findOne({ member: memberId, idempotencyKey }).populate('resource');
    if (existing) {
      return { booking: existing, isReplay: true };
    }
  }

  // 2. Validate time alignment and past time
  const startDate = new Date(start);
  const endDate = new Date(end);
  assertFutureTime(startDate);
  const slotKeys = toSlotKeys(startDate, endDate);

  // 3. Verify Space
  const space = await Space.findById(resourceId);
  if (!space) {
    throw ApiError.notFound('Space not found', ERROR_CODES.NOT_FOUND);
  }

  // 4. Verify Operating Hours
  if (!isWithinOperatingHours(startDate, endDate, space.operatingHours)) {
    throw ApiError.unprocessable(
      `Booking is outside operating hours (${space.operatingHours.open} - ${space.operatingHours.close})`,
      ERROR_CODES.OUTSIDE_HOURS
    );
  }

  // 5. Calculate Pricing
  const pricing = await calculatePrice({
    memberId,
    space,
    start: startDate,
    end: endDate,
  });

  const initialStatus = space.requiresApproval ? BOOKING_STATUS.PENDING : BOOKING_STATUS.CONFIRMED;

  // 6. Insert Booking (Unique partial index catches concurrent collisions atomically!)
  const booking = new Booking({
    member: memberId,
    resource: space._id,
    start: startDate,
    end: endDate,
    slotKeys,
    holding: true,
    status: initialStatus,
    price: pricing.finalPrice,
    idempotencyKey: idempotencyKey || null,
    notes: notes || '',
  });

  // Generate QR Token
  booking.qrToken = generateBookingQrToken(booking._id, endDate);
  await booking.save();

  // 7. Post-commit Side Effects
  if (pricing.finalPrice > 0) {
    await recordBookingPayment({
      memberId,
      bookingId: booking._id,
      amount: pricing.finalPrice,
    });
  }

  // Emit availability update to location room
  emitAvailability({
    location: space.location,
    spaceId: space._id.toString(),
    slotKeys,
    held: true,
  });

  // Notify member
  await notifyMember({
    memberId,
    title: initialStatus === BOOKING_STATUS.CONFIRMED ? 'Booking Confirmed' : 'Booking Pending Approval',
    body: `Your booking for ${space.name} has been received.`,
    data: { bookingId: booking._id.toString() },
  });

  await booking.populate('resource');
  return { booking, isReplay: false };
};

const listBookings = async ({ user, query }) => {
  const filter = {};

  if (user.role === ROLES.MEMBER) {
    filter.member = user.id;
  } else if (query.member) {
    filter.member = query.member;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.resource) {
    filter.resource = query.resource;
  }

  if (query.from || query.to) {
    filter.start = {};
    if (query.from) filter.start.$gte = new Date(query.from);
    if (query.to) filter.start.$lte = new Date(query.to);
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('resource')
      .populate('member', 'name email company')
      .sort({ start: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getBookingById = async (id, user) => {
  const booking = await Booking.findById(id)
    .populate('resource')
    .populate('member', 'name email company');

  if (!booking) {
    throw ApiError.notFound('Booking not found', ERROR_CODES.NOT_FOUND);
  }

  if (user.role === ROLES.MEMBER && booking.member._id.toString() !== user.id) {
    throw ApiError.forbidden('You are not authorized to view this booking', ERROR_CODES.FORBIDDEN);
  }

  return booking;
};

const updateBookingStatus = async (id, newStatus, user, notes) => {
  const booking = await Booking.findById(id).populate('resource');
  if (!booking) {
    throw ApiError.notFound('Booking not found', ERROR_CODES.NOT_FOUND);
  }

  // Manager required for approve / reject
  if ([BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.REJECTED].includes(newStatus) && user.role === ROLES.MEMBER) {
    throw ApiError.forbidden('Only managers can approve or reject bookings', ERROR_CODES.FORBIDDEN);
  }

  // Assert state machine transition
  assertTransition(booking.status, newStatus);

  booking.status = newStatus;
  if (notes) booking.notes = notes;

  if (shouldReleaseHolding(newStatus)) {
    booking.holding = false;
  }

  if (newStatus === BOOKING_STATUS.CHECKED_IN) {
    booking.checkedInAt = new Date();
  }

  await booking.save();

  // Socket emissions
  emitBookingStatus({
    memberId: booking.member.toString(),
    bookingId: booking._id.toString(),
    status: newStatus,
  });

  emitAvailability({
    location: booking.resource.location,
    spaceId: booking.resource._id.toString(),
    slotKeys: booking.slotKeys,
    held: booking.holding,
  });

  return booking;
};

const cancelBooking = async (id, user) => {
  const booking = await Booking.findById(id).populate('resource');
  if (!booking) {
    throw ApiError.notFound('Booking not found', ERROR_CODES.NOT_FOUND);
  }

  if (user.role === ROLES.MEMBER && booking.member.toString() !== user.id) {
    throw ApiError.forbidden('You cannot cancel another member booking', ERROR_CODES.FORBIDDEN);
  }

  // Check state machine
  assertTransition(booking.status, BOOKING_STATUS.CANCELLED);

  // Compute refund policy
  const now = Date.now();
  const startTime = new Date(booking.start).getTime();
  const diffMinutes = (startTime - now) / (60 * 1000);

  let refundAmount = 0;
  if (booking.price > 0) {
    if (diffMinutes >= SLOT_CONFIG.CANCELLATION_FREE_WINDOW_MINUTES) {
      refundAmount = booking.price; // 100% full refund
    } else if (diffMinutes > 0) {
      refundAmount = Math.round(booking.price * SLOT_CONFIG.PARTIAL_REFUND_RATIO * 100) / 100; // 50% partial
    }
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.holding = false;
  booking.cancelledAt = new Date();
  booking.refundAmount = refundAmount;

  await booking.save();

  if (refundAmount > 0) {
    await recordBookingRefund({
      memberId: booking.member,
      bookingId: booking._id,
      amount: refundAmount,
    });
  }

  // Release slots on live floor
  emitAvailability({
    location: booking.resource.location,
    spaceId: booking.resource._id.toString(),
    slotKeys: booking.slotKeys,
    held: false,
  });

  emitBookingStatus({
    memberId: booking.member.toString(),
    bookingId: booking._id.toString(),
    status: BOOKING_STATUS.CANCELLED,
  });

  return booking;
};

module.exports = {
  createBooking,
  listBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
};

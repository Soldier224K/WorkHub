const asyncHandler = require('../../shared/asyncHandler');
const { success, created } = require('../../shared/respond');
const bookingService = require('./booking.service');

const createBooking = asyncHandler(async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  const { booking, isReplay } = await bookingService.createBooking({
    memberId: req.user.id,
    resourceId: req.body.resource,
    start: req.body.start,
    end: req.body.end,
    notes: req.body.notes,
    idempotencyKey,
  });

  return isReplay ? success(res, booking) : created(res, booking);
});

const listBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.listBookings({
    user: req.user,
    query: req.query,
  });
  return success(res, result.bookings, result.meta);
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user);
  return success(res, booking);
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBookingStatus(
    req.params.id,
    req.body.status,
    req.user,
    req.body.notes
  );
  return success(res, booking);
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user);
  return success(res, booking);
});

module.exports = {
  createBooking,
  listBookings,
  getBooking,
  updateBooking,
  cancelBooking,
};

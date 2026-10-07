const asyncHandler = require('../../shared/asyncHandler');
const { success, created } = require('../../shared/respond');
const guestsService = require('./guests.service');

const inviteGuest = asyncHandler(async (req, res) => {
  const guest = await guestsService.inviteGuest({
    user: req.user,
    bookingId: req.body.bookingId,
    name: req.body.name,
    email: req.body.email,
  });
  return created(res, guest);
});

const listGuests = asyncHandler(async (req, res) => {
  const guests = await guestsService.listGuests(req.user);
  return success(res, guests);
});

const getGuestsByBooking = asyncHandler(async (req, res) => {
  const guests = await guestsService.getGuestsByBooking(req.params.id, req.user);
  return success(res, guests);
});

const getPublicGuestPass = asyncHandler(async (req, res) => {
  const pass = await guestsService.getPublicGuestPass(req.params.token);
  return success(res, pass);
});

module.exports = {
  inviteGuest,
  listGuests,
  getGuestsByBooking,
  getPublicGuestPass,
};

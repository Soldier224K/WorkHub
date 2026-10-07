const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const {
  inviteGuestSchema,
  getBookingGuestsSchema,
  getGuestPassSchema,
} = require('./guests.schema');
const guestsController = require('./guests.controller');

const router = express.Router();

// ★ Public tokenised guest pass
router.get('/pass/:token', validate(getGuestPassSchema), guestsController.getPublicGuestPass);

// Authenticated member/manager routes
router.use(authenticate);
router.post('/', validate(inviteGuestSchema), guestsController.inviteGuest);
router.get('/', guestsController.listGuests);
router.get('/booking/:id', validate(getBookingGuestsSchema), guestsController.getGuestsByBooking);

module.exports = router;

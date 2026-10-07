const express = require('express');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const {
  createBookingSchema,
  updateBookingSchema,
  getBookingSchema,
  listBookingsSchema,
} = require('./booking.schema');
const bookingController = require('./booking.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', validate(createBookingSchema), bookingController.createBooking);
router.get('/', validate(listBookingsSchema), bookingController.listBookings);
router.get('/:id', validate(getBookingSchema), bookingController.getBooking);
router.put('/:id', validate(updateBookingSchema), bookingController.updateBooking);
router.delete('/:id', validate(getBookingSchema), bookingController.cancelBooking);

module.exports = router;

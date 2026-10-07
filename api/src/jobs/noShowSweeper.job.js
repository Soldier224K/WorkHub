const cron = require('node-cron');
const Booking = require('../modules/bookings/booking.model');
const { BOOKING_STATUS, SLOT_CONFIG } = require('../config/constants');
const { emitAvailability, emitBookingStatus } = require('../sockets/emitters');
const logger = require('../shared/logger');

const runNoShowSweeper = async () => {
  const cutoff = new Date(Date.now() - SLOT_CONFIG.NO_SHOW_GRACE_MINUTES * 60 * 1000);
  logger.info({ cutoff }, '🔍 Running no-show sweeper...');

  const expiredBookings = await Booking.find({
    status: BOOKING_STATUS.CONFIRMED,
    checkedInAt: null,
    start: { $lte: cutoff },
    holding: true,
  }).populate('resource');

  let sweptCount = 0;

  for (const booking of expiredBookings) {
    booking.status = BOOKING_STATUS.NO_SHOW;
    booking.holding = false;
    await booking.save();
    sweptCount++;

    emitBookingStatus({
      memberId: booking.member.toString(),
      bookingId: booking._id.toString(),
      status: BOOKING_STATUS.NO_SHOW,
    });

    if (booking.resource) {
      emitAvailability({
        location: booking.resource.location,
        spaceId: booking.resource._id.toString(),
        slotKeys: booking.slotKeys,
        held: false,
      });
    }
  }

  logger.info(`✅ No-show sweeper completed: ${sweptCount} bookings marked as no-show.`);
  return { sweptCount };
};

const startNoShowSweeperJob = () => {
  // Every 5 minutes
  return cron.schedule('*/5 * * * *', runNoShowSweeper);
};

module.exports = {
  runNoShowSweeper,
  startNoShowSweeperJob,
};

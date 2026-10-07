const cron = require('node-cron');
const Booking = require('../modules/bookings/booking.model');
const { BOOKING_STATUS, NOTIFICATION_CHANNELS } = require('../config/constants');
const { notifyMember } = require('../modules/notifications/notify.service');
const logger = require('../shared/logger');

const runBookingReminder = async () => {
  const now = Date.now();
  const windowStart = new Date(now + 10 * 60 * 1000);
  const windowEnd = new Date(now + 20 * 60 * 1000);

  const upcomingBookings = await Booking.find({
    status: BOOKING_STATUS.CONFIRMED,
    start: { $gte: windowStart, $lte: windowEnd },
  }).populate('resource');

  let remindedCount = 0;

  for (const booking of upcomingBookings) {
    await notifyMember({
      memberId: booking.member,
      title: 'Upcoming Booking Reminder',
      body: `Your booking for ${booking.resource?.name || 'desk'} starts in 15 minutes.`,
      channel: NOTIFICATION_CHANNELS.PUSH,
      data: {
        bookingId: booking._id.toString(),
        qrToken: booking.qrToken,
      },
    });
    remindedCount++;
  }

  return { remindedCount };
};

const startBookingReminderJob = () => {
  return cron.schedule('*/5 * * * *', runBookingReminder);
};

module.exports = {
  runBookingReminder,
  startBookingReminderJob,
};

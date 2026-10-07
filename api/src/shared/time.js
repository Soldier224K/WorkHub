const ApiError = require('./ApiError');
const { ERROR_CODES } = require('../config/constants');

const isWithinOperatingHours = (startDate, endDate, operatingHours) => {
  if (!operatingHours || !operatingHours.open || !operatingHours.close) {
    return true; // If not defined, default open
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check days of week if provided (0 = Sunday, 1 = Monday, etc.)
  if (Array.isArray(operatingHours.days) && operatingHours.days.length > 0) {
    const startDay = start.getUTCDay();
    const endDay = end.getUTCDay();
    if (!operatingHours.days.includes(startDay) || !operatingHours.days.includes(endDay)) {
      return false;
    }
  }

  // Parse open/close HH:mm
  const [openH, openM] = operatingHours.open.split(':').map(Number);
  const [closeH, closeM] = operatingHours.close.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
  const endMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();

  // If start is before open or end is after close
  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    return false;
  }

  return true;
};

const assertFutureTime = (startDate, graceMs = 60000) => {
  const start = new Date(startDate);
  if (start.getTime() < Date.now() - graceMs) {
    throw ApiError.unprocessable('Booking start time cannot be in the past', ERROR_CODES.PAST_TIME);
  }
};

module.exports = {
  isWithinOperatingHours,
  assertFutureTime,
};

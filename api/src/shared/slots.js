const { SLOT_CONFIG } = require('../config/constants');
const ApiError = require('./ApiError');
const { ERROR_CODES } = require('../config/constants');

const isSlotAligned = (date) => {
  const d = new Date(date);
  return d.getMinutes() % SLOT_CONFIG.SLOT_MINUTES === 0 &&
         d.getSeconds() === 0 &&
         d.getMilliseconds() === 0;
};

const formatDateToSlotKey = (date) => {
  return new Date(date).toISOString().slice(0, 16);
};

const slotToDate = (slotKey) => {
  return new Date(`${slotKey}:00.000Z`);
};

const toSlotKeys = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw ApiError.badRequest('Invalid date provided', ERROR_CODES.VALIDATION_FAILED);
  }

  if (end <= start) {
    throw ApiError.badRequest('End time must be strictly after start time', ERROR_CODES.VALIDATION_FAILED);
  }

  if (!isSlotAligned(start) || !isSlotAligned(end)) {
    throw ApiError.badRequest(
      `Times must be aligned to ${SLOT_CONFIG.SLOT_MINUTES}-minute increments (e.g. :00 or :30)`,
      ERROR_CODES.VALIDATION_FAILED
    );
  }

  const durationMin = (end.getTime() - start.getTime()) / (60 * 1000);
  if (durationMin < SLOT_CONFIG.MIN_BOOKING_MINUTES) {
    throw ApiError.badRequest(
      `Minimum booking duration is ${SLOT_CONFIG.MIN_BOOKING_MINUTES} minutes`,
      ERROR_CODES.VALIDATION_FAILED
    );
  }

  if (durationMin > SLOT_CONFIG.MAX_BOOKING_MINUTES) {
    throw ApiError.badRequest(
      `Maximum booking duration is ${SLOT_CONFIG.MAX_BOOKING_MINUTES / 60} hours`,
      ERROR_CODES.VALIDATION_FAILED
    );
  }

  const slotKeys = [];
  let current = new Date(start.getTime());
  const stepMs = SLOT_CONFIG.SLOT_MINUTES * 60 * 1000;

  while (current.getTime() < end.getTime()) {
    slotKeys.push(formatDateToSlotKey(current));
    current = new Date(current.getTime() + stepMs);
  }

  return slotKeys;
};

module.exports = {
  isSlotAligned,
  formatDateToSlotKey,
  slotToDate,
  toSlotKeys,
};

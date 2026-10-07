const { BOOKING_STATUS, ERROR_CODES } = require('../../config/constants');
const ApiError = require('../../shared/ApiError');

const ALLOWED_TRANSITIONS = {
  [BOOKING_STATUS.PENDING]: [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.REJECTED,
    BOOKING_STATUS.CANCELLED,
  ],
  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.CHECKED_IN,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.NO_SHOW,
  ],
  [BOOKING_STATUS.CHECKED_IN]: [
    BOOKING_STATUS.COMPLETED,
  ],
  [BOOKING_STATUS.COMPLETED]: [],
  [BOOKING_STATUS.CANCELLED]: [],
  [BOOKING_STATUS.REJECTED]: [],
  [BOOKING_STATUS.NO_SHOW]: [],
};

const assertTransition = (currentStatus, targetStatus) => {
  if (currentStatus === targetStatus) {
    return true;
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw ApiError.conflict(
      `Illegal booking state transition from '${currentStatus}' to '${targetStatus}'`,
      ERROR_CODES.INVALID_STATE_TRANSITION,
      { currentStatus, targetStatus, allowedTransitions: allowed }
    );
  }

  return true;
};

const shouldReleaseHolding = (status) => {
  return [
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.REJECTED,
    BOOKING_STATUS.NO_SHOW,
    BOOKING_STATUS.COMPLETED,
  ].includes(status);
};

module.exports = {
  ALLOWED_TRANSITIONS,
  assertTransition,
  shouldReleaseHolding,
};

const { assertTransition, shouldReleaseHolding } = require('../../src/modules/bookings/booking.state');
const { BOOKING_STATUS } = require('../../src/config/constants');

describe('Unit: Booking State Machine', () => {
  test('allows legal transitions from pending', () => {
    expect(() => assertTransition(BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED)).not.toThrow();
    expect(() => assertTransition(BOOKING_STATUS.PENDING, BOOKING_STATUS.REJECTED)).not.toThrow();
    expect(() => assertTransition(BOOKING_STATUS.PENDING, BOOKING_STATUS.CANCELLED)).not.toThrow();
  });

  test('allows legal transitions from confirmed', () => {
    expect(() => assertTransition(BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN)).not.toThrow();
    expect(() => assertTransition(BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED)).not.toThrow();
    expect(() => assertTransition(BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.NO_SHOW)).not.toThrow();
  });

  test('blocks illegal transitions and throws error', () => {
    expect(() => assertTransition(BOOKING_STATUS.CANCELLED, BOOKING_STATUS.CONFIRMED)).toThrow(/Illegal booking state transition/);
    expect(() => assertTransition(BOOKING_STATUS.REJECTED, BOOKING_STATUS.CHECKED_IN)).toThrow(/Illegal booking state transition/);
    expect(() => assertTransition(BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED)).toThrow(/Illegal booking state transition/);
    expect(() => assertTransition(BOOKING_STATUS.NO_SHOW, BOOKING_STATUS.COMPLETED)).toThrow(/Illegal booking state transition/);
  });

  test('identifies terminal statuses that release holding', () => {
    expect(shouldReleaseHolding(BOOKING_STATUS.CANCELLED)).toBe(true);
    expect(shouldReleaseHolding(BOOKING_STATUS.REJECTED)).toBe(true);
    expect(shouldReleaseHolding(BOOKING_STATUS.NO_SHOW)).toBe(true);
    expect(shouldReleaseHolding(BOOKING_STATUS.CONFIRMED)).toBe(false);
    expect(shouldReleaseHolding(BOOKING_STATUS.CHECKED_IN)).toBe(false);
  });
});

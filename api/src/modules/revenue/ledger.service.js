const Transaction = require('./transaction.model');
const { TRANSACTION_TYPES } = require('../../config/constants');
const logger = require('../../shared/logger');

const recordBookingPayment = async ({ memberId, bookingId, amount }) => {
  return Transaction.create({
    type: TRANSACTION_TYPES.BOOKING_PAYMENT,
    amount,
    member: memberId,
    refs: { booking: bookingId },
  });
};

const recordBookingRefund = async ({ memberId, bookingId, amount }) => {
  return Transaction.create({
    type: TRANSACTION_TYPES.BOOKING_REFUND,
    amount,
    member: memberId,
    refs: { booking: bookingId },
  });
};

const recordPassRenewal = async ({ memberId, passId, amount, period }) => {
  return Transaction.create({
    type: TRANSACTION_TYPES.PASS_RENEWAL,
    amount,
    member: memberId,
    refs: { pass: passId },
    period,
  });
};

const recordAmenityCharge = async ({ memberId, amenityId, amount }) => {
  return Transaction.create({
    type: TRANSACTION_TYPES.AMENITY_CHARGE,
    amount,
    member: memberId,
    refs: { amenity: amenityId },
  });
};

module.exports = {
  recordBookingPayment,
  recordBookingRefund,
  recordPassRenewal,
  recordAmenityCharge,
};

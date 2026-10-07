const ApiError = require('../shared/ApiError');
const logger = require('../shared/logger');
const { ERROR_CODES } = require('../config/constants');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected server error occurred';
  let details = err.details || null;

  // Handle MongoDB Duplicate Key (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const keyPattern = err.keyPattern || {};

    if (keyPattern.resource && keyPattern.slotKeys) {
      code = ERROR_CODES.SLOT_TAKEN;
      message = 'One or more requested slots are already booked by another member';
    } else if (keyPattern.email) {
      code = ERROR_CODES.CONFLICT;
      message = 'Email address is already registered';
    } else if (keyPattern.idempotencyKey) {
      code = ERROR_CODES.CONFLICT;
      message = 'A request with this Idempotency-Key has already been processed';
    } else if (keyPattern['refs.pass'] && keyPattern.period) {
      code = ERROR_CODES.CONFLICT;
      message = 'Pass renewal has already been processed for this billing period';
    } else if (keyPattern.member && keyPattern.status) {
      code = ERROR_CODES.CONFLICT;
      message = 'Member already has an active subscription pass';
    } else if (keyPattern.qrToken) {
      code = ERROR_CODES.CONFLICT;
      message = 'A guest or booking with this QR token already exists';
    } else {
      code = ERROR_CODES.CONFLICT;
      message = 'Duplicate key constraint violation';
    }
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_FAILED;
    message = 'Validation Error';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_FAILED;
    message = `Invalid format for field: ${err.path}`;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error({
      reqId: req.id,
      err,
      url: req.originalUrl,
      method: req.method,
    }, '💥 Unhandled Server Exception');
  } else {
    logger.warn({
      reqId: req.id,
      statusCode,
      code,
      message,
      url: req.originalUrl,
      method: req.method,
    }, '⚠️ Operational Request Error');
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};

module.exports = errorHandler;

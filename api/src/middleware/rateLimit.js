const rateLimit = require('express-rate-limit');
const { ERROR_CODES } = require('../config/constants');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.FORBIDDEN,
      message: 'Too many authentication attempts, please try again after 15 minutes',
    },
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.FORBIDDEN,
      message: 'Too many API requests from this IP, please try again later',
    },
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};

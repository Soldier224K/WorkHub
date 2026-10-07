const { ERROR_CODES } = require('../config/constants');

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Cannot ${req.method} ${req.originalUrl}`,
      details: null,
    },
  });
};

module.exports = notFound;

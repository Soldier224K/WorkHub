const { ERROR_CODES } = require('../config/constants');

class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', code = ERROR_CODES.VALIDATION_FAILED, details = null) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = 'Unauthorized', code = ERROR_CODES.UNAUTHORIZED, details = null) {
    return new ApiError(401, code, message, details);
  }

  static forbidden(message = 'Forbidden', code = ERROR_CODES.FORBIDDEN, details = null) {
    return new ApiError(403, code, message, details);
  }

  static notFound(message = 'Resource not found', code = ERROR_CODES.NOT_FOUND, details = null) {
    return new ApiError(404, code, message, details);
  }

  static conflict(message = 'Resource conflict', code = ERROR_CODES.CONFLICT, details = null) {
    return new ApiError(409, code, message, details);
  }

  static unprocessable(message = 'Unprocessable Entity', code = ERROR_CODES.OUTSIDE_HOURS, details = null) {
    return new ApiError(422, code, message, details);
  }
}

module.exports = ApiError;

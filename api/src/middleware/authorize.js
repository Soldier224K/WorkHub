const ApiError = require('../shared/ApiError');
const { ERROR_CODES, ROLES } = require('../config/constants');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required', ERROR_CODES.UNAUTHORIZED));
    }

    // Admin has access to all authorized endpoints
    const effectiveRoles = [...allowedRoles, ROLES.ADMIN];

    if (!effectiveRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `User role '${req.user.role}' is not authorized to access this resource`,
          ERROR_CODES.FORBIDDEN
        )
      );
    }

    next();
  };
};

module.exports = authorize;

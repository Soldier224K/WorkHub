const ApiError = require('../shared/ApiError');
const { ERROR_CODES } = require('../config/constants');

const validate = (schemas = {}) => {
  return async (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error.errors) {
        const formatted = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(
          ApiError.badRequest('Validation failed', ERROR_CODES.VALIDATION_FAILED, formatted)
        );
      }
      next(error);
    }
  };
};

module.exports = validate;

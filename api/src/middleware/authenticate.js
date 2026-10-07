const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../shared/ApiError');
const { ERROR_CODES } = require('../config/constants');
const Member = require('../modules/members/member.model');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or invalid Authorization header', ERROR_CODES.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Access token has expired', ERROR_CODES.TOKEN_EXPIRED);
      }
      throw ApiError.unauthorized('Invalid access token', ERROR_CODES.UNAUTHORIZED);
    }

    // Attach user information
    const member = await Member.findById(decoded.id).select('-passwordHash');
    if (!member) {
      throw ApiError.unauthorized('User not found or deleted', ERROR_CODES.UNAUTHORIZED);
    }

    req.user = {
      id: member._id.toString(),
      _id: member._id,
      email: member.email,
      name: member.name,
      role: member.role,
      company: member.company,
      deviceTokens: member.deviceTokens,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;

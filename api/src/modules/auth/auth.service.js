const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const ApiError = require('../../shared/ApiError');
const { ERROR_CODES } = require('../../config/constants');
const Member = require('../members/member.model');

const generateTokens = (member) => {
  const payload = {
    id: member._id.toString(),
    email: member.email,
    role: member.role,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

const register = async ({ name, email, password, company, role }) => {
  const existing = await Member.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('Email is already registered', ERROR_CODES.CONFLICT);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const member = await Member.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    company: company || '',
    role: role || 'member',
  });

  const tokens = generateTokens(member);

  return {
    user: {
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      role: member.role,
      company: member.company,
    },
    ...tokens,
  };
};

const login = async ({ email, password }) => {
  const member = await Member.findOne({ email: email.toLowerCase() });
  if (!member) {
    throw ApiError.unauthorized('Invalid email or password', ERROR_CODES.UNAUTHORIZED);
  }

  const isMatch = await member.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password', ERROR_CODES.UNAUTHORIZED);
  }

  const tokens = generateTokens(member);

  return {
    user: {
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      role: member.role,
      company: member.company,
    },
    ...tokens,
  };
};

const refresh = async ({ refreshToken }) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token', ERROR_CODES.TOKEN_EXPIRED);
  }

  const member = await Member.findById(decoded.id);
  if (!member) {
    throw ApiError.unauthorized('User not found', ERROR_CODES.UNAUTHORIZED);
  }

  const tokens = generateTokens(member);
  return tokens;
};

module.exports = {
  register,
  login,
  refresh,
};

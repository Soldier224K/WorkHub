const Member = require('./member.model');
const Pass = require('../passes/pass.model');
const ApiError = require('../../shared/ApiError');
const { ERROR_CODES, PASS_STATUS } = require('../../config/constants');

const getMe = async (memberId) => {
  const member = await Member.findById(memberId).select('-passwordHash');
  if (!member) {
    throw ApiError.notFound('Member not found', ERROR_CODES.NOT_FOUND);
  }

  const activePass = await Pass.findOne({
    member: memberId,
    status: PASS_STATUS.ACTIVE,
  });

  return {
    ...member.toObject(),
    activePass: activePass || null,
  };
};

const registerDeviceToken = async (memberId, token) => {
  const member = await Member.findByIdAndUpdate(
    memberId,
    { $addToSet: { deviceTokens: token } },
    { new: true }
  ).select('-passwordHash');

  if (!member) {
    throw ApiError.notFound('Member not found', ERROR_CODES.NOT_FOUND);
  }

  return member;
};

module.exports = {
  getMe,
  registerDeviceToken,
};

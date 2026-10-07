const Pass = require('./pass.model');
const ApiError = require('../../shared/ApiError');
const { PASS_STATUS, PASS_PLANS, ERROR_CODES, ROLES } = require('../../config/constants');
const { recordPassRenewal } = require('../revenue/ledger.service');

const createPass = async ({ user, passData }) => {
  const targetMemberId = (user.role === ROLES.MANAGER && passData.memberId)
    ? passData.memberId
    : user.id;

  // Check if member already has active pass
  const existingActive = await Pass.findOne({
    member: targetMemberId,
    status: PASS_STATUS.ACTIVE,
  });

  if (existingActive) {
    throw ApiError.conflict('Member already has an active subscription pass', ERROR_CODES.CONFLICT);
  }

  // Calculate nextRenewalAt
  const now = new Date();
  const nextRenewal = new Date(now);
  if (passData.plan === PASS_PLANS.DAY_PASS) {
    nextRenewal.setDate(nextRenewal.getDate() + 1);
  } else {
    nextRenewal.setMonth(nextRenewal.getMonth() + 1);
  }

  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const pass = await Pass.create({
    member: targetMemberId,
    plan: passData.plan,
    price: passData.price,
    renewDay: passData.renewDay || 1,
    autoRenew: passData.autoRenew ?? true,
    status: PASS_STATUS.ACTIVE,
    nextRenewalAt: nextRenewal,
    lastRenewedPeriod: currentPeriod,
  });

  // Record initial transaction
  if (pass.price > 0) {
    await recordPassRenewal({
      memberId: targetMemberId,
      passId: pass._id,
      amount: pass.price,
      period: currentPeriod,
    });
  }

  return pass;
};

const listPasses = async (user) => {
  const filter = {};
  if (user.role === ROLES.MEMBER) {
    filter.member = user.id;
  }
  return Pass.find(filter).populate('member', 'name email company').sort({ createdAt: -1 });
};

const getPassesByUser = async (targetUserId, requestingUser) => {
  if (requestingUser.role === ROLES.MEMBER && requestingUser.id !== targetUserId) {
    throw ApiError.forbidden('You can only view your own passes', ERROR_CODES.FORBIDDEN);
  }

  return Pass.find({ member: targetUserId }).sort({ createdAt: -1 });
};

module.exports = {
  createPass,
  listPasses,
  getPassesByUser,
};

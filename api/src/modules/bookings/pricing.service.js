const Pass = require('../passes/pass.model');
const { PASS_STATUS, PASS_PLANS, SPACE_TYPES } = require('../../config/constants');

const calculatePrice = async ({ memberId, space, start, end }) => {
  const durationHours = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
  const basePrice = Math.round(durationHours * space.hourlyRate * 100) / 100;

  // Check if member has an active pass that covers this space type
  const activePass = await Pass.findOne({
    member: memberId,
    status: PASS_STATUS.ACTIVE,
  });

  let discount = 0;
  let passCovered = false;

  if (activePass) {
    if (activePass.plan === PASS_PLANS.HOT_DESK_MONTHLY && space.type === SPACE_TYPES.DESK) {
      discount = basePrice;
      passCovered = true;
    } else if (activePass.plan === PASS_PLANS.DAY_PASS && space.type === SPACE_TYPES.DESK) {
      discount = basePrice;
      passCovered = true;
    } else if (activePass.plan === PASS_PLANS.DEDICATED_DESK && (space.type === SPACE_TYPES.DESK || space.type === SPACE_TYPES.TEAM_ROOM)) {
      discount = basePrice;
      passCovered = true;
    }
  }

  const finalPrice = Math.max(0, Math.round((basePrice - discount) * 100) / 100);

  return {
    durationHours,
    hourlyRate: space.hourlyRate,
    basePrice,
    discount,
    finalPrice,
    passCovered,
    passId: passCovered && activePass ? activePass._id : null,
  };
};

module.exports = {
  calculatePrice,
};

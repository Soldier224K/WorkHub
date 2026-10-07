const asyncHandler = require('../../shared/asyncHandler');
const { success } = require('../../shared/respond');
const membersService = require('./members.service');

const getMe = asyncHandler(async (req, res) => {
  const result = await membersService.getMe(req.user.id);
  return success(res, result);
});

const updateDevice = asyncHandler(async (req, res) => {
  const result = await membersService.registerDeviceToken(req.user.id, req.body.token);
  return success(res, result);
});

module.exports = {
  getMe,
  updateDevice,
};

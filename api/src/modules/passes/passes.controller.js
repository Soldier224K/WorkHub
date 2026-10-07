const asyncHandler = require('../../shared/asyncHandler');
const { success, created } = require('../../shared/respond');
const passesService = require('./passes.service');

const createPass = asyncHandler(async (req, res) => {
  const pass = await passesService.createPass({
    user: req.user,
    passData: req.body,
  });
  return created(res, pass);
});

const listPasses = asyncHandler(async (req, res) => {
  const passes = await passesService.listPasses(req.user);
  return success(res, passes);
});

const getPassesByUser = asyncHandler(async (req, res) => {
  const passes = await passesService.getPassesByUser(req.params.id, req.user);
  return success(res, passes);
});

module.exports = {
  createPass,
  listPasses,
  getPassesByUser,
};

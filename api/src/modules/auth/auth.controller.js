const asyncHandler = require('../../shared/asyncHandler');
const { success, created } = require('../../shared/respond');
const authService = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return created(res, result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return success(res, result);
});

const refresh = asyncHandler(async (req, res) => {
  const tokens = await authService.refresh(req.body);
  return success(res, tokens);
});

const logout = asyncHandler(async (req, res) => {
  return success(res, { message: 'Logged out successfully' });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
};

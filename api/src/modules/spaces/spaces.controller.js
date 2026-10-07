const asyncHandler = require('../../shared/asyncHandler');
const { success, created } = require('../../shared/respond');
const spacesService = require('./spaces.service');

const listSpaces = asyncHandler(async (req, res) => {
  const result = await spacesService.listSpaces(req.query);
  return success(res, result.spaces, result.meta);
});

const getSpace = asyncHandler(async (req, res) => {
  const space = await spacesService.getSpaceById(req.params.id);
  return success(res, space);
});

const createSpace = asyncHandler(async (req, res) => {
  const space = await spacesService.createSpace(req.body);
  return created(res, space);
});

const updateSpace = asyncHandler(async (req, res) => {
  const space = await spacesService.updateSpace(req.params.id, req.body);
  return success(res, space);
});

const getAvailability = asyncHandler(async (req, res) => {
  const availability = await spacesService.getAvailability({
    location: req.query.location,
    date: req.query.date,
    memberId: req.user ? req.user.id : null,
  });
  return success(res, availability);
});

module.exports = {
  listSpaces,
  getSpace,
  createSpace,
  updateSpace,
  getAvailability,
};

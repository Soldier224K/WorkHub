const asyncHandler = require('../../shared/asyncHandler');
const { success, created } = require('../../shared/respond');
const amenitiesService = require('./amenities.service');

const listAmenities = asyncHandler(async (req, res) => {
  const amenities = await amenitiesService.listAmenities(req.query);
  return success(res, amenities);
});

const getAmenity = asyncHandler(async (req, res) => {
  const amenity = await amenitiesService.getAmenityById(req.params.id);
  return success(res, amenity);
});

const createAmenity = asyncHandler(async (req, res) => {
  const amenity = await amenitiesService.createAmenity(req.body);
  return created(res, amenity);
});

module.exports = {
  listAmenities,
  getAmenity,
  createAmenity,
};

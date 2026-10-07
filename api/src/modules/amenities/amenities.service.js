const Amenity = require('./amenity.model');
const ApiError = require('../../shared/ApiError');
const { ERROR_CODES } = require('../../config/constants');

const listAmenities = async ({ location, kind }) => {
  const query = {};
  if (location) query.location = new RegExp(`^${location}$`, 'i');
  if (kind) query.kind = kind;

  return Amenity.find(query).sort({ name: 1 });
};

const getAmenityById = async (id) => {
  const amenity = await Amenity.findById(id);
  if (!amenity) {
    throw ApiError.notFound('Amenity not found', ERROR_CODES.NOT_FOUND);
  }
  return amenity;
};

const createAmenity = async (data) => {
  return Amenity.create(data);
};

module.exports = {
  listAmenities,
  getAmenityById,
  createAmenity,
};

const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { ROLES } = require('../../config/constants');
const {
  createAmenitySchema,
  getAmenitySchema,
  listAmenitiesSchema,
} = require('./amenities.schema');
const amenitiesController = require('./amenities.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', validate(listAmenitiesSchema), amenitiesController.listAmenities);
router.get('/:id', validate(getAmenitySchema), amenitiesController.getAmenity);
router.post(
  '/',
  authorize(ROLES.MANAGER),
  validate(createAmenitySchema),
  amenitiesController.createAmenity
);

module.exports = router;

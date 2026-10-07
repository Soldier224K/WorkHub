const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { ROLES } = require('../../config/constants');
const {
  createSpaceSchema,
  updateSpaceSchema,
  getSpaceSchema,
  listSpacesSchema,
  availabilitySchema,
} = require('./spaces.schema');
const spacesController = require('./spaces.controller');

const router = express.Router();

router.use(authenticate);

// ★ Per-space availability
router.get('/availability', validate(availabilitySchema), spacesController.getAvailability);

router.get('/', validate(listSpacesSchema), spacesController.listSpaces);
router.get('/:id', validate(getSpaceSchema), spacesController.getSpace);

// Manager actions
router.post(
  '/',
  authorize(ROLES.MANAGER),
  validate(createSpaceSchema),
  spacesController.createSpace
);

router.put(
  '/:id',
  authorize(ROLES.MANAGER),
  validate(updateSpaceSchema),
  spacesController.updateSpace
);

module.exports = router;

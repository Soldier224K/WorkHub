const express = require('express');
const qrController = require('./qr.controller');

const router = express.Router();

router.get('/check-in/:id', qrController.checkIn);

module.exports = router;

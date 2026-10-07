const asyncHandler = require('../../shared/asyncHandler');
const { success } = require('../../shared/respond');
const qrService = require('./qr.service');

const checkIn = asyncHandler(async (req, res) => {
  const result = await qrService.checkIn({
    bookingId: req.params.id,
    token: req.query.token,
  });
  return success(res, result);
});

module.exports = {
  checkIn,
};

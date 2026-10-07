const success = (res, data = null, meta = undefined, statusCode = 200) => {
  const payload = {
    success: true,
    data,
  };
  if (meta !== undefined) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

const created = (res, data = null, meta = undefined) => {
  return success(res, data, meta, 201);
};

module.exports = {
  success,
  created,
};

let ioInstance = null;

const setIo = (io) => {
  ioInstance = io;
};

const getIo = () => ioInstance;

const emitAvailability = ({ location, spaceId, slotKeys, held }) => {
  if (!ioInstance || !location) return;
  ioInstance.to(`loc:${location}`).emit('availability:update', {
    spaceId,
    slotKeys,
    held,
  });
};

const emitBookingStatus = ({ memberId, bookingId, status }) => {
  if (!ioInstance || !memberId) return;
  ioInstance.to(`member:${memberId}`).emit('booking:status', {
    bookingId,
    status,
  });
};

const emitDeskUnlocked = ({ memberId, bookingId, spaceName }) => {
  if (!ioInstance || !memberId) return;
  ioInstance.to(`member:${memberId}`).emit('desk:unlocked', {
    bookingId,
    spaceName,
    timestamp: new Date().toISOString(),
  });
};

const emitPassRenewed = ({ memberId, passId, period }) => {
  if (!ioInstance || !memberId) return;
  ioInstance.to(`member:${memberId}`).emit('pass:renewed', {
    passId,
    period,
  });
};

module.exports = {
  setIo,
  getIo,
  emitAvailability,
  emitBookingStatus,
  emitDeskUnlocked,
  emitPassRenewed,
};

const ROLES = {
  MEMBER: 'member',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  NO_SHOW: 'no_show',
};

const SPACE_TYPES = {
  DESK: 'desk',
  MEETING_ROOM: 'meeting_room',
  TEAM_ROOM: 'team_room',
};

const AMENITY_KINDS = {
  SLOT: 'slot',
  USAGE: 'usage',
};

const PASS_PLANS = {
  DAY_PASS: 'day_pass',
  HOT_DESK_MONTHLY: 'hot_desk_monthly',
  DEDICATED_DESK: 'dedicated_desk',
};

const PASS_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

const GUEST_STATUS = {
  INVITED: 'invited',
  CHECKED_IN: 'checked_in',
  CANCELLED: 'cancelled',
};

const TRANSACTION_TYPES = {
  BOOKING_PAYMENT: 'booking_payment',
  BOOKING_REFUND: 'booking_refund',
  PASS_RENEWAL: 'pass_renewal',
  AMENITY_CHARGE: 'amenity_charge',
};

const NOTIFICATION_CHANNELS = {
  PUSH: 'push',
  IN_APP: 'in_app',
  EMAIL: 'email',
};

const NOTIFICATION_STATUS = {
  QUEUED: 'queued',
  SENT: 'sent',
  FAILED: 'failed',
};

const ERROR_CODES = {
  SLOT_TAKEN: 'SLOT_TAKEN',
  OUTSIDE_HOURS: 'OUTSIDE_HOURS',
  PAST_TIME: 'PAST_TIME',
  GUEST_LIMIT: 'GUEST_LIMIT',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
};

const SLOT_CONFIG = {
  SLOT_MINUTES: 30,
  MIN_BOOKING_MINUTES: 30,
  MAX_BOOKING_MINUTES: 720,
  NO_SHOW_GRACE_MINUTES: 15,
  REMINDER_LEAD_MINUTES: 15,
  CANCELLATION_FREE_WINDOW_MINUTES: 60,
  PARTIAL_REFUND_RATIO: 0.5,
};

module.exports = {
  ROLES,
  BOOKING_STATUS,
  SPACE_TYPES,
  AMENITY_KINDS,
  PASS_PLANS,
  PASS_STATUS,
  GUEST_STATUS,
  TRANSACTION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
  ERROR_CODES,
  SLOT_CONFIG,
};

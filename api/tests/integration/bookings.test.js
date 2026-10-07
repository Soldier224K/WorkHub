const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const Member = require('../../src/modules/members/member.model');
const Space = require('../../src/modules/spaces/space.model');
const Booking = require('../../src/modules/bookings/booking.model');
const authService = require('../../src/modules/auth/auth.service');
const { BOOKING_STATUS } = require('../../src/config/constants');

describe('Integration: Booking Lifecycle & Idempotency', () => {
  let member;
  let space;
  const start = '2027-06-15T10:00:00.000Z';
  const end = '2027-06-15T12:00:00.000Z';

  beforeAll(async () => {
    await connectDB();

    member = await authService.register({
      name: 'Booking Tester',
      email: `booking_test_${Date.now()}@workhub.io`,
      password: 'Password123!',
      company: 'Test Org',
    });

    space = await Space.findOne({ location: 'Downtown' });
  });

  afterAll(async () => {
    await Booking.deleteMany({ member: member.user.id });
    await Member.findByIdAndDelete(member.user.id);
    await disconnectDB();
  });

  test('POST /api/v1/bookings creates confirmed booking with holding: true', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        resource: space._id.toString(),
        start,
        end,
        notes: 'Integration test reservation',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.holding).toBe(true);
    expect(res.body.data.status).toBe(BOOKING_STATUS.CONFIRMED);
    expect(res.body.data.slotKeys).toHaveLength(4);
    expect(res.body.data.qrToken).toBeDefined();
  });

  test('POST /api/v1/bookings replay with same Idempotency-Key returns existing booking without duplicate', async () => {
    const idempotencyKey = `idem_${Date.now()}`;
    const slotStart = '2027-07-20T14:00:00.000Z';
    const slotEnd = '2027-07-20T15:00:00.000Z';

    // First request
    const firstRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        resource: space._id.toString(),
        start: slotStart,
        end: slotEnd,
      });

    expect(firstRes.status).toBe(201);

    // Replay request
    const replayRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        resource: space._id.toString(),
        start: slotStart,
        end: slotEnd,
      });

    expect(replayRes.status).toBe(200);
    expect(replayRes.body.data._id).toBe(firstRes.body.data._id);
  });

  test('GET /api/v1/spaces/availability shows booked slot indices for the time rail', async () => {
    const res = await request(app)
      .get('/api/v1/spaces/availability')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .query({
        location: 'Downtown',
        date: '2027-06-15',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.operatingWindow).toBeDefined();
    expect(res.body.data.spaces).toBeInstanceOf(Array);

    const targetSpace = res.body.data.spaces.find((s) => s.id === space._id.toString());
    expect(targetSpace).toBeDefined();
    expect(targetSpace.bookedSlotKeys.length).toBeGreaterThan(0);
    expect(targetSpace.bookedSlotIndices.length).toBeGreaterThan(0);
  });

  test('GET /api/v1/qr/check-in/:id unlocks desk and updates status to checked_in', async () => {
    const booking = await Booking.findOne({ member: member.user.id, status: BOOKING_STATUS.CONFIRMED });
    expect(booking).toBeDefined();

    const res = await request(app)
      .get(`/api/v1/qr/check-in/${booking._id}`)
      .query({ token: booking.qrToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking.status).toBe(BOOKING_STATUS.CHECKED_IN);
    expect(res.body.data.booking.checkedInAt).toBeDefined();
  });

  test('DELETE /api/v1/bookings/:id soft cancels booking and releases holding', async () => {
    const newStart = '2027-08-10T10:00:00.000Z';
    const newEnd = '2027-08-10T11:00:00.000Z';

    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        resource: space._id.toString(),
        start: newStart,
        end: newEnd,
      });

    const bookingId = createRes.body.data._id;

    const cancelRes = await request(app)
      .delete(`/api/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${member.accessToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe(BOOKING_STATUS.CANCELLED);
    expect(cancelRes.body.data.holding).toBe(false);

    // Slot is now free to be re-booked!
    const rebookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        resource: space._id.toString(),
        start: newStart,
        end: newEnd,
      });

    expect(rebookRes.status).toBe(201);
  });
});

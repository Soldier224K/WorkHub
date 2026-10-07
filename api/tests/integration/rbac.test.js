const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const Member = require('../../src/modules/members/member.model');
const authService = require('../../src/modules/auth/auth.service');
const { ROLES, ERROR_CODES, SPACE_TYPES } = require('../../src/config/constants');

describe('Integration: Role-Based Access Control (RBAC) Matrix', () => {
  let member;
  let manager;

  beforeAll(async () => {
    await connectDB();

    member = await authService.register({
      name: 'Regular Member',
      email: `rbac_member_${Date.now()}@workhub.io`,
      password: 'Password123!',
      role: ROLES.MEMBER,
    });

    manager = await authService.register({
      name: 'Operations Manager',
      email: `rbac_manager_${Date.now()}@workhub.io`,
      password: 'Password123!',
      role: ROLES.MANAGER,
    });
  });

  afterAll(async () => {
    await Member.deleteMany({ email: /rbac_/ });
    await disconnectDB();
  });

  describe('Unauthenticated Access Gates', () => {
    test('unauthenticated request to /api/v1/members/me returns 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/members/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    test('unauthenticated request to /api/v1/spaces returns 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/spaces');
      expect(res.status).toBe(401);
    });
  });

  describe('Manager-only Endpoints vs Member Role', () => {
    test('POST /api/v1/spaces returns 403 FORBIDDEN for member', async () => {
      const res = await request(app)
        .post('/api/v1/spaces')
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({
          name: 'Illegal Desk',
          type: SPACE_TYPES.DESK,
          location: 'Downtown',
          hourlyRate: 10,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    test('POST /api/v1/spaces returns 201 for manager', async () => {
      const res = await request(app)
        .post('/api/v1/spaces')
        .set('Authorization', `Bearer ${manager.accessToken}`)
        .send({
          name: 'Manager Created Desk',
          type: SPACE_TYPES.DESK,
          location: 'Downtown',
          hourlyRate: 15,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Manager Created Desk');
    });

    test('GET /api/v1/reports/heatmap returns 403 for member', async () => {
      const res = await request(app)
        .get('/api/v1/reports/heatmap')
        .set('Authorization', `Bearer ${member.accessToken}`);

      expect(res.status).toBe(403);
    });

    test('GET /api/v1/reports/heatmap returns 200 for manager', async () => {
      const res = await request(app)
        .get('/api/v1/reports/heatmap')
        .set('Authorization', `Bearer ${manager.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.grid).toHaveLength(168); // 7 days x 24 hours
    });

    test('POST /api/v1/notifications/send returns 403 for member', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/send')
        .set('Authorization', `Bearer ${member.accessToken}`)
        .send({
          memberId: member.user.id,
          title: 'Hello',
          body: 'World',
        });

      expect(res.status).toBe(403);
    });
  });
});

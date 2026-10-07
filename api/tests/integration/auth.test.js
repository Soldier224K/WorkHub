const request = require('supertest');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');
const Member = require('../../src/modules/members/member.model');
const { ERROR_CODES } = require('../../src/config/constants');

describe('Integration: Authentication Endpoints', () => {
  const testUser = {
    name: 'Auth Test User',
    email: 'authtest_' + Date.now() + '@workhub.io',
    password: 'ValidPassword123!',
    company: 'Test Corp',
  };

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await Member.deleteMany({ email: testUser.email });
    await disconnectDB();
  });

  test('POST /api/v1/auth/register creates user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  test('POST /api/v1/auth/register rejects duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ERROR_CODES.CONFLICT);
  });

  test('POST /api/v1/auth/login verifies credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('POST /api/v1/auth/login rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  test('POST /api/v1/auth/refresh issues new tokens', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const refreshToken = loginRes.body.data.refreshToken;

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });
});

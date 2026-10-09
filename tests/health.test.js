require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const { app } = require('../server');

describe('Health Check Endpoints', () => {
  test('GET /health/live should return 200 and uptime', async () => {
    const res = await request(app).get('/health/live');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  test('GET /health/ready should return 200 when database is connected', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.database).toBe('connected');
  });
});

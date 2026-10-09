require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');

describe('Challenges API Tests', () => {
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;

  beforeAll(async () => {
    // Register user 1
    const reg1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Challenger User',
        email: 'challenger@test.com',
        password: 'password123'
      });
    user1Token = reg1.body.token;
    user1Id = reg1.body.user._id || reg1.body.user.id;

    // Register user 2
    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Target User',
        email: 'target@test.com',
        password: 'password123'
      });
    user2Token = reg2.body.token;
    user2Id = reg2.body.user._id || reg2.body.user.id;
  });

  test('GET /api/challenges - should retrieve empty challenge lists without errors', async () => {
    const res = await request(app)
      .get('/api/challenges')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.incoming).toBeDefined();
    expect(res.body.outgoing).toBeDefined();
    expect(res.body.history).toBeDefined();
  });

  test('POST /api/challenges - should create challenge between users', async () => {
    const res = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        targetUserId: user2Id,
        topic: 'javascript',
        difficulty: 'medium'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.challenge).toBeDefined();
    expect(res.body.challenge.topic).toBe('javascript');
  });

  test('GET /api/challenges - should show incoming for user2 and outgoing for user1', async () => {
    const res1 = await request(app)
      .get('/api/challenges')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res1.statusCode).toBe(200);
    expect(res1.body.outgoing.length).toBeGreaterThan(0);

    const res2 = await request(app)
      .get('/api/challenges')
      .set('Authorization', `Bearer ${user2Token}`);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.incoming.length).toBeGreaterThan(0);
  });
});

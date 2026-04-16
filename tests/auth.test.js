require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

describe('Authentication API Tests', () => {
  
  // ==========================================
  // TEST 1: USER REGISTRATION
  // ==========================================
  describe('POST /api/auth/register', () => {
    
    test('Should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.msg).toBe('User registered successfully');
      
      // Verify user was saved to database
      const user = await User.findOne({ email: 'john@test.com' });
      expect(user).not.toBeNull();
      expect(user.name).toBe('John Doe');
    });

    test('Should not register user with duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@test.com',
          password: 'password123'
        });

      // Try to register with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'john@test.com',
          password: 'password456'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe('User already exists');
    });

    test('Should not register user with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          // missing email and password
        });

      expect(res.statusCode).toBe(500);
    });
  });

  // ==========================================
  // TEST 2: USER LOGIN
  // ==========================================
  describe('POST /api/auth/login', () => {
    
    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@test.com',
          password: 'password123'
        });
    });

    test('Should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
    });

    test('Should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@test.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe('Invalid credentials');
    });

    test('Should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe('Invalid credentials');
    });

    test('Should return valid JWT token that can be decoded', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@test.com',
          password: 'password123'
        });

      const token = loginRes.body.token;
      const jwt = require('jsonwebtoken');
      
      // Decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.user.id).toBeDefined();
    });
  });

  // ==========================================
  // TEST 3: PROTECTED ROUTE - GET /me
  // ==========================================
  describe('GET /api/auth/me (Protected Route)', () => {
    
    let token;

    beforeEach(async () => {
      // Register and login to get token
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@test.com',
          password: 'password123'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@test.com',
          password: 'password123'
        });

      token = loginRes.body.token;
    });

    test('Should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('John Doe');
      expect(res.body.email).toBe('john@test.com');
      expect(res.body.password).toBeUndefined(); // Password should not be returned
    });

    test('Should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toBe('No token, authorization denied');
    });

    test('Should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here');

      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toBe('Token is not valid');
    });

    test('Should reject request with malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token');

      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toBe('No token, authorization denied');
    });

    test('Should reject request with expired token', async () => {
      // Create a token that expires immediately
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { user: { id: 'testid' } },
        process.env.JWT_SECRET,
        { expiresIn: '0s' } // Expires immediately
      );

      // Wait a bit to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toBe('Token is not valid');
    });
  });

  // ==========================================
  // TEST 4: AUTHENTICATION MIDDLEWARE FIXES
  // ==========================================
  describe('Auth Middleware - Fixed Issues', () => {
    
    let token;

    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@test.com',
          password: 'password123'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        });

      token = loginRes.body.token;
    });

    test('Should not have double response error with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      // If there was a double response error, this would fail
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe('test@test.com');
    });

    test('Should not have double response error with missing token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      // If there was a double response error, this would fail
      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toBe('No token, authorization denied');
    });

    test('Should not have double response error with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid');

      // If there was a double response error, this would fail
      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toBe('Token is not valid');
    });
  });
});

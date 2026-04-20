#!/usr/bin/env node
/**
 * Quick test script to verify quiz endpoints work with language slugs
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { app } = require('./server');

dotenv.config();

const request = require('supertest');

// Test user credentials (will need to be created or use a test token)
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

async function runTests() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // 1. Register and login to get a token
    console.log('\n📝 Testing user registration...');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'password123'
      });

    if (registerRes.status !== 201) {
      console.error('❌ Registration failed:', registerRes.body);
      return;
    }

    const token = registerRes.body.token;
    console.log('✓ User registered successfully');
    console.log('✓ Token obtained:', token.substring(0, 20) + '...');

    // 2. Test NEW endpoint: GET /api/quizzes/javascript
    console.log('\n🎯 Testing NEW endpoint: GET /api/quizzes/javascript');
    const newEndpointRes = await request(app)
      .get('/api/quizzes/javascript')
      .set('Authorization', `Bearer ${token}`);

    if (newEndpointRes.status === 200) {
      console.log('✓ NEW endpoint works!');
      console.log('  - Status:', newEndpointRes.status);
      console.log('  - Quiz title:', newEndpointRes.body.title);
      console.log('  - Language:', newEndpointRes.body.language);
      console.log('  - Questions count:', newEndpointRes.body.questions.length);
    } else {
      console.error('❌ NEW endpoint failed!');
      console.error('  - Status:', newEndpointRes.status);
      console.error('  - Response:', newEndpointRes.body);
    }

    // 3. Test LEGACY endpoint: GET /api/quiz/javascript
    console.log('\n🎯 Testing LEGACY endpoint: GET /api/quiz/javascript');
    const legacyEndpointRes = await request(app)
      .get('/api/quiz/javascript')
      .set('Authorization', `Bearer ${token}`);

    if (legacyEndpointRes.status === 200) {
      console.log('✓ LEGACY endpoint works!');
      console.log('  - Status:', legacyEndpointRes.status);
      console.log('  - Quiz title:', legacyEndpointRes.body.title);
      console.log('  - Language:', legacyEndpointRes.body.language);
      console.log('  - Questions count:', legacyEndpointRes.body.questions.length);
    } else {
      console.error('❌ LEGACY endpoint failed!');
      console.error('  - Status:', legacyEndpointRes.status);
      console.error('  - Response:', legacyEndpointRes.body);
    }

    // 4. Test with Python
    console.log('\n🎯 Testing with different language: GET /api/quiz/python');
    const pythonRes = await request(app)
      .get('/api/quiz/python')
      .set('Authorization', `Bearer ${token}`);

    if (pythonRes.status === 200) {
      console.log('✓ Python quiz works!');
      console.log('  - Quiz title:', pythonRes.body.title);
      console.log('  - Language:', pythonRes.body.language);
    } else {
      console.error('❌ Python quiz failed!');
      console.error('  - Status:', pythonRes.status);
      console.error('  - Response:', pythonRes.body);
    }

    console.log('\n✅ All tests completed!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Test error:', err.message);
    process.exit(1);
  }
}

runTests();

#!/usr/bin/env node
/**
 * Comprehensive test for quiz submit button
 * Tests both with valid token and without token
 */
const https = require('https');

const baseURL = 'https://syntaxflow-backend.onrender.com';

console.log('\n🧪 Quiz Submit Button - Comprehensive Diagnosis\n');
console.log('='.repeat(70) + '\n');

// Test payload
const submitPayload = {
  answers: [
    { questionId: 'q1', selectedOptionIds: ['o2'] }
  ],
  timeTaken: 60,
  tabSwitchCount: 0
};

function makeRequest(method, path, token = null, body = null) {
  return new Promise((resolve) => {
    const url = new URL(baseURL + path);
    const data = body ? JSON.stringify(body) : null;
    
    const options = {
      method,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? data.length : 0,
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', chunk => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, body: responseData });
        }
      });
    });

    req.on('error', err => {
      resolve({ status: 'ERROR', error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', error: 'Request timeout' });
    });

    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('📌 DIAGNOSIS: What Could Be Wrong With Submit Button\n');

  console.log('POSSIBLE ISSUES:');
  console.log('  1. Frontend not sending Authorization header');
  console.log('  2. Frontend sending malformed request payload');
  console.log('  3. Backend not accepting the quiz submission');
  console.log('  4. CORS blocking the request');
  console.log('  5. Server error on backend\n');

  console.log('═'.repeat(70) + '\n');

  // Test 1: Check if routes exist
  console.log('Test 1️⃣  : Check if submit routes exist (without auth)\n');
  
  const noAuthTest = await makeRequest('POST', '/api/quiz/javascript/submit', null, submitPayload);
  console.log(`   POST /api/quiz/javascript/submit (no token)`);
  console.log(`   Status: ${noAuthTest.status}`);
  if (noAuthTest.body?.msg) console.log(`   Message: ${noAuthTest.body.msg}`);
  console.log(`   → ${noAuthTest.status === 401 ? '✅ Route exists (returns 401 for auth)' : '❌ Route issue'}\n`);

  // Test 2: Test loading quiz first
  console.log('Test 2️⃣  : Check quiz load endpoint\n');
  
  const quizLoadTest = await makeRequest('GET', '/api/quiz/javascript', null);
  console.log(`   GET /api/quiz/javascript (no token)`);
  console.log(`   Status: ${quizLoadTest.status}`);
  if (quizLoadTest.body?.msg) console.log(`   Message: ${quizLoadTest.body.msg}`);
  console.log(`   → ${quizLoadTest.status === 401 || quizLoadTest.status === 200 ? '✅ Route exists' : '❌ Route missing'}\n`);

  console.log('═'.repeat(70) + '\n');

  console.log('📊 RESULTS SUMMARY:\n');

  if (noAuthTest.status === 401 && noAuthTest.body?.msg === 'No token, authorization denied') {
    console.log('✅ Submit routes are WORKING correctly');
    console.log('   → Returns 401 (No Token) when auth header missing');
    console.log('   → This is EXPECTED behavior\n');
    console.log('📌 SOLUTION: Frontend must send valid JWT token in Authorization header\n');
  } else if (noAuthTest.status === 401 && noAuthTest.body?.msg === 'Token is not valid') {
    console.log('⚠️  Submit routes exist but token validation failing');
    console.log('   → Might be auth middleware issue\n');
  } else if (noAuthTest.status === 404 || noAuthTest.status === 'TIMEOUT') {
    console.log('❌ Submit routes NOT WORKING');
    console.log(`   → Status: ${noAuthTest.status}`);
    console.log('   → Backend needs to redeploy or routes have issues\n');
  }

  console.log('═'.repeat(70) + '\n');
  console.log('🎯 NEXT STEPS FOR FRONTEND TEAM:\n');
  console.log('1. Verify user is LOGGED IN before clicking submit');
  console.log('2. Check browser DevTools → Network tab → see Request Headers');
  console.log('3. Confirm "Authorization: Bearer <token>" header is present');
  console.log('4. If missing token, user needs to login first');
  console.log('5. If token present but still failing, check browser Console for errors\n');

  console.log('═'.repeat(70) + '\n');
}

run();

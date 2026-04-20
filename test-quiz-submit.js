#!/usr/bin/env node
/**
 * Test quiz submission flow to diagnose score reflection issue
 */
const https = require('https');

const baseURL = 'https://syntaxflow-backend.onrender.com';

console.log('\n🧪 Testing Quiz Submission Flow\n');
console.log('='.repeat(60) + '\n');

// Sample quiz submission payload
const submitPayload = {
  answers: [
    {
      questionId: 'q1',
      selectedOptionIds: ['o2']
    },
    {
      questionId: 'q2',
      selectedOptionIds: ['o1']
    },
    {
      questionId: 'q3',
      selectedOptionIds: ['o1', 'o2']
    }
  ],
  timeTaken: 120,
  tabSwitchCount: 0
};

function testSubmit(path, token) {
  return new Promise((resolve) => {
    const url = new URL(baseURL + path);
    
    console.log(`\n📍 Testing: ${path}`);
    console.log(`   Payload: ${JSON.stringify(submitPayload)}`);
    
    const data = JSON.stringify(submitPayload);
    
    const options = {
      method: 'POST',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        
        try {
          const json = JSON.parse(responseData);
          console.log(`   Response: ${JSON.stringify(json, null, 2).substring(0, 200)}...`);
        } catch (e) {
          console.log(`   Response: ${responseData.substring(0, 200)}`);
        }
        
        resolve({
          path,
          status: res.statusCode,
          data: responseData
        });
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve({
        path,
        status: 'ERROR',
        error: err.message
      });
    });

    req.on('timeout', () => {
      console.log(`   ⏱️  Timeout (5s)`);
      req.destroy();
      resolve({
        path,
        status: 'TIMEOUT'
      });
    });

    req.write(data);
    req.end();
  });
}

async function run() {
  // Test without token first to see what happens
  console.log('🔍 STEP 1: Test submission WITHOUT auth token\n');
  await testSubmit('/api/quiz/javascript/submit', null);
  
  console.log('\n🔍 STEP 2: What the frontend likely expects\n');
  console.log('The frontend uses: GET /api/quiz/javascript (works now ✅)');
  console.log('The frontend likely uses: POST /api/quiz/javascript/submit');
  console.log('\nBut the backend endpoint is: POST /:identifier/submit');
  console.log('So POST /api/quiz/javascript/submit gets routed to');
  console.log('POST /:identifier/submit with identifier="javascript"');
  console.log('\n✅ This should work! The question is: why isn\'t score showing?');

  console.log('\n' + '='.repeat(60));
  console.log('\nPossible Issues:');
  console.log('1. Frontend not sending proper auth token');
  console.log('2. Frontend not parsing the response correctly');
  console.log('3. Frontend expecting different response format');
  console.log('4. Quiz attempt save failing silently\n');
}

run();

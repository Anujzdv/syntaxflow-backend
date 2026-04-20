#!/usr/bin/env node
/**
 * Test the quiz submit endpoint to diagnose why submit button isn't working
 */
const https = require('https');

const baseURL = 'https://syntaxflow-backend.onrender.com';

console.log('\n🧪 Testing Quiz Submit Endpoint\n');
console.log('='.repeat(60) + '\n');

// Minimal submission payload
const submitPayload = {
  answers: [
    {
      questionId: 'q1',
      selectedOptionIds: ['o2']
    }
  ],
  timeTaken: 60,
  tabSwitchCount: 0
};

function testSubmit(path, token) {
  return new Promise((resolve) => {
    const url = new URL(baseURL + path);
    
    console.log(`\n📍 Testing: ${path}`);
    console.log(`   Method: POST`);
    
    const data = JSON.stringify(submitPayload);
    
    const options = {
      method: 'POST',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': token ? `Bearer ${token}` : 'Bearer demo-token-for-testing'
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
          console.log(`   Response:\n${JSON.stringify(json, null, 2).substring(0, 500)}`);
        } catch (e) {
          console.log(`   Response: ${responseData.substring(0, 300)}`);
        }
        
        resolve({
          path,
          status: res.statusCode,
          data: responseData
        });
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Request Error: ${err.message}`);
      resolve({
        path,
        status: 'ERROR',
        error: err.message
      });
    });

    req.on('timeout', () => {
      console.log(`   ⏱️  Timeout (10s) - Backend may be starting up`);
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
  console.log('🔍 Attempting to submit quiz with demo token\n');
  
  // Test 1: Try submitting to new endpoint
  console.log('Test 1: New endpoint with demo token');
  await testSubmit('/api/quizzes/javascript/submit', 'demo-token-for-testing');
  
  // Test 2: Try submitting to legacy endpoint
  console.log('\n\nTest 2: Legacy endpoint with demo token');
  await testSubmit('/api/quiz/javascript/submit', 'demo-token-for-testing');

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Analysis:\n');
  console.log('Expected Status Codes:');
  console.log('  • 201: Success (quiz submitted)');
  console.log('  • 400: Bad request (invalid payload)');
  console.log('  • 401: Unauthorized (no/invalid token)');
  console.log('  • 404: Not found (route not found)');
  console.log('  • 500: Server error (bug in code)');
  console.log('  • TIMEOUT: Backend not responding\n');
}

run();

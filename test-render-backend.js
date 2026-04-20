#!/usr/bin/env node
/**
 * Test the actual Render backend to see what it's returning
 */
const https = require('https');

const baseURL = 'https://syntaxflow-backend.onrender.com';

console.log('\n🔍 Testing Actual Render Backend\n');
console.log('Target: ' + baseURL);
console.log('='.repeat(60) + '\n');

// Test without auth (to see if there's a 404 or 401)
function testEndpoint(path) {
  return new Promise((resolve) => {
    const url = new URL(baseURL + path);
    
    console.log(`\n📍 Testing: ${path}`);
    console.log('   URL: ' + url.toString());
    
    const options = {
      method: 'GET',
      timeout: 5000,
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        
        // Try to parse JSON
        try {
          const json = JSON.parse(data);
          console.log(`   Response: ${JSON.stringify(json).substring(0, 100)}...`);
        } catch (e) {
          console.log(`   Response: ${data.substring(0, 100)}`);
        }
        
        resolve({
          path,
          status: res.statusCode,
          data
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

    req.end();
  });
}

async function run() {
  const endpoints = [
    '/api/quiz/javascript',
    '/api/quiz/python',
    '/api/quizzes/javascript',
    '/api/auth/test',
  ];

  console.log('🚀 Starting endpoint tests...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    // Wait a bit between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Test Complete\n');
  console.log('Next Steps:');
  console.log('1. If getting 404: Render needs to redeploy with latest code');
  console.log('2. If getting 401: Auth issue - testing endpoint without token');
  console.log('3. If timeout: Backend may be spinning up (free tier)');
  console.log('4. If working: Frontend has a token/CORS issue\n');
}

run();

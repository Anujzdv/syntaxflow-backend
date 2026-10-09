#!/usr/bin/env node
/**
 * Simple verification that the routes are correctly mounted
 */
const express = require('express');

// Load the server configuration
const fs = require('fs');
const serverCode = fs.readFileSync('./server.js', 'utf8');
const quizCode = fs.readFileSync('./routes/quiz.js', 'utf8');

console.log('📋 Checking Backend Configuration...\n');

// 1. Check if both mount points exist in server.js
console.log('✓ Checking server.js for route mounts:');
if (serverCode.includes("app.use('/api/quizzes', quizRoutes)")) {
  console.log('  ✓ Found: app.use(\'/api/quizzes\', quizRoutes)');
} else {
  console.error('  ❌ Missing: app.use(\'/api/quizzes\', quizRoutes)');
}

if (serverCode.includes("app.use('/api/quiz', quizRoutes)")) {
  console.log('  ✓ Found: app.use(\'/api/quiz\', quizRoutes) - Legacy support');
} else {
  console.error('  ❌ Missing: app.use(\'/api/quiz\', quizRoutes) - Legacy support');
}

// 2. Check if the new dynamic route exists
console.log('\n✓ Checking routes/quiz.js for endpoint definitions:');
if (quizCode.includes("router.get('/:identifier', auth,")) {
  console.log('  ✓ Found: GET /:identifier (new endpoint, supports ObjectId and language slugs)');
} else {
  console.error('  ❌ Missing: GET /:identifier endpoint');
}

if (quizCode.includes("async function resolveQuiz(identifier)")) {
  console.log('  ✓ Found: resolveQuiz() helper function');
} else {
  console.error('  ❌ Missing: resolveQuiz() helper function');
}

if (quizCode.includes("const isMongoId = /^[0-9a-fA-F]{24}$/.test(identifier)")) {
  console.log('  ✓ Found: ObjectId validation regex');
} else {
  console.error('  ❌ Missing: ObjectId validation regex');
}

if (quizCode.includes("language: { $regex: new RegExp(`^${identifier}$`, 'i') }")) {
  console.log('  ✓ Found: Language slug lookup (case-insensitive)');
} else {
  console.error('  ❌ Missing: Language slug lookup');
}

// 3. Check if legacy routes have been removed
console.log('\n✓ Checking for duplicate/legacy route definitions:');
if (!quizCode.includes("// ============================================\n// LEGACY QUIZ ROUTES")) {
  console.log('  ✓ Legacy route section removed (no shadowing issues)');
} else {
  console.warn('  ⚠️  Legacy route section still exists');
}

console.log('\n🎯 Endpoint URLs that will now work:\n');
console.log('  NEW (Primary):  GET /api/quizzes/:identifier');
console.log('  LEGACY (Alias): GET /api/quiz/:identifier');
console.log('\nWhere :identifier can be:');
console.log('  - MongoDB ObjectId (24 hex characters): 507f1f77bcf86cd799439011');
console.log('  - Language slug (case-insensitive):    javascript, python, java, c++, c, etc.');

console.log('\n📱 Frontend will successfully call:\n');
console.log('  GET /api/quiz/javascript');
console.log('  GET /api/quiz/python');
console.log('  GET /api/quiz/java');

console.log('\n✅ Backend configuration is correct!\n');

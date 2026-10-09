#!/usr/bin/env node
/**
 * Test what the backend is actually returning for quiz endpoints
 */
const fs = require('fs');

console.log('📊 Diagnostic Report: Quiz Endpoint Status\n');
console.log('='.repeat(60) + '\n');

// 1. Check server.js mounting
console.log('1️⃣  Checking server.js route mounts:');
const serverCode = fs.readFileSync('./server.js', 'utf8');
const hasQuizzesMount = serverCode.includes("app.use('/api/quizzes', quizRoutes)");
const hasQuizMount = serverCode.includes("app.use('/api/quiz', quizRoutes)");

console.log(`   ${hasQuizzesMount ? '✅' : '❌'} /api/quizzes mount point: ${hasQuizzesMount ? 'FOUND' : 'MISSING'}`);
console.log(`   ${hasQuizMount ? '✅' : '❌'} /api/quiz mount point: ${hasQuizMount ? 'FOUND' : 'MISSING'}`);

// 2. Check routes/quiz.js implementation
console.log('\n2️⃣  Checking routes/quiz.js route definitions:');
const quizCode = fs.readFileSync('./routes/quiz.js', 'utf8');

// Count route definitions
const getRoutes = (quizCode.match(/router\.get\(/g) || []).length;
const postRoutes = (quizCode.match(/router\.post\(/g) || []).length;
console.log(`   GET routes defined: ${getRoutes}`);
console.log(`   POST routes defined: ${postRoutes}`);

// Check for the dynamic identifier route
const hasIdentifierRoute = quizCode.includes("router.get('/:identifier',");
console.log(`   ${hasIdentifierRoute ? '✅' : '❌'} Dynamic GET /:identifier route: ${hasIdentifierRoute ? 'FOUND' : 'MISSING'}`);

// Check for resolveQuiz function
const hasResolveQuiz = quizCode.includes('async function resolveQuiz(identifier)');
console.log(`   ${hasResolveQuiz ? '✅' : '❌'} resolveQuiz() helper function: ${hasResolveQuiz ? 'FOUND' : 'MISSING'}`);

// 3. Check for language slug support
console.log('\n3️⃣  Checking language slug resolution:');
const hasObjectIdCheck = quizCode.includes('/^[0-9a-fA-F]{24}$/.test(identifier)');
const hasLanguageLookup = quizCode.includes("language: { $regex: new RegExp(`^${identifier}`");
console.log(`   ${hasObjectIdCheck ? '✅' : '❌'} ObjectId validation: ${hasObjectIdCheck ? 'FOUND' : 'MISSING'}`);
console.log(`   ${hasLanguageLookup ? '✅' : '❌'} Language slug lookup: ${hasLanguageLookup ? 'FOUND' : 'MISSING'}`);

// 4. Check for duplicate legacy routes
console.log('\n4️⃣  Checking for duplicate routes:');
const hasDuplicateGetLanguage = quizCode.match(/router\.get\('\/:\w+',/g) || [];
const hasLegacySection = quizCode.includes('// LEGACY QUIZ ROUTES');
console.log(`   GET /:param route count: ${hasDuplicateGetLanguage.length} (should be 1)`);
console.log(`   ${hasLegacySection ? '❌' : '✅'} Legacy section present: ${hasLegacySection ? 'YES (PROBLEM!)' : 'NO (GOOD)'}`);

// 5. Check Fallback Quiz Data
console.log('\n5️⃣  Checking fallback demo data:');
const hasFallbackData = quizCode.includes('const getFallbackQuiz');
const fallbackLanguages = (quizCode.match(/javascript:|python:|java:|c\+\+:|c:/g) || []).length;
console.log(`   ${hasFallbackData ? '✅' : '❌'} Fallback quiz function: ${hasFallbackData ? 'FOUND' : 'MISSING'}`);
console.log(`   Fallback languages available: ${fallbackLanguages}`);

// 6. Summary
console.log('\n' + '='.repeat(60));
console.log('\n📋 Summary:\n');

const allGood = hasQuizzesMount && hasQuizMount && hasIdentifierRoute && 
                hasResolveQuiz && hasObjectIdCheck && hasLanguageLookup && !hasLegacySection;

if (allGood) {
  console.log('✅ All checks PASSED!');
  console.log('\nWhat should work:');
  console.log('  • GET /api/quiz/javascript → Returns quiz');
  console.log('  • GET /api/quiz/python → Returns quiz');
  console.log('  • GET /api/quizzes/javascript → Returns quiz');
  console.log('  • GET /api/quizzes/:mongoId → Returns quiz');
} else {
  console.log('❌ ISSUES DETECTED:\n');
  if (!hasQuizzesMount) console.log('  ❌ Missing /api/quizzes mount point');
  if (!hasQuizMount) console.log('  ❌ Missing /api/quiz mount point (CRITICAL!)');
  if (!hasIdentifierRoute) console.log('  ❌ Missing dynamic /:identifier route');
  if (!hasResolveQuiz) console.log('  ❌ Missing resolveQuiz() helper');
  if (!hasObjectIdCheck) console.log('  ❌ Missing ObjectId validation');
  if (!hasLanguageLookup) console.log('  ❌ Missing language slug lookup');
  if (hasLegacySection) console.log('  ❌ Legacy routes still present (causes shadowing)');
}

console.log('\n' + '='.repeat(60) + '\n');

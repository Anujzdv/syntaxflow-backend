require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

describe('Quiz Engine API Tests', () => {

  let testUser;
  let testToken;
  let testQuiz;

  // ==========================================
  // SETUP: Create test user and quiz
  // ==========================================
  beforeAll(async () => {
    // Register test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Quiz Tester',
        email: 'quiz@test.com',
        password: 'testpass123'
      });

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'quiz@test.com',
        password: 'testpass123'
      });

    testToken = loginRes.body.token;
    testUser = await User.findOne({ email: 'quiz@test.com' });

    // Create a test quiz with all three question types
    testQuiz = await Quiz.create({
      title: 'JavaScript Fundamentals',
      language: 'JavaScript',
      difficulty: 'easy',
      xp_reward: 100,
      timeLimit: 300,
      passingScore: 60,
      questions: [
        {
          question_text: 'What is the output of typeof null?',
          code_snippet: null,
          type: 'single',
          explanation: 'In JavaScript, typeof null returns "object" due to a historical bug.',
          tags: ['typeof', 'data-types'],
          options: [
            { text: 'null', is_correct: false },
            { text: 'object', is_correct: true },
            { text: 'undefined', is_correct: false },
            { text: 'NaN', is_correct: false }
          ]
        },
        {
          question_text: 'Is JavaScript a compiled language?',
          code_snippet: null,
          type: 'true_false',
          explanation: 'JavaScript is both interpreted and compiled (JIT compilation).',
          tags: ['compilation', 'basics'],
          options: [
            { text: 'True', is_correct: false },
            { text: 'False', is_correct: true }
          ]
        },
        {
          question_text: 'Which of the following are JavaScript array methods?',
          code_snippet: null,
          type: 'multi',
          explanation: 'forEach, map, and filter are all array methods. isInteger is a Number method.',
          tags: ['array-methods'],
          options: [
            { text: 'forEach', is_correct: true },
            { text: 'map', is_correct: true },
            { text: 'filter', is_correct: true },
            { text: 'isInteger', is_correct: false }
          ]
        }
      ]
    });
  });

  // ==========================================
  // TEST 1: GET /api/quizzes/:quizId - Fetch Quiz
  // ==========================================
  describe('GET /api/quizzes/:quizId', () => {

    test('Should fetch quiz successfully with authentication', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${testQuiz._id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(testQuiz._id.toString());
      expect(res.body.title).toBe('JavaScript Fundamentals');
      expect(res.body.language).toBe('JavaScript');
      expect(res.body.difficulty).toBe('easy');
      expect(res.body.timeLimit).toBe(300);
      expect(res.body.xp_reward).toBe(100);
    });

    test('Should return sanitized quiz data (NO is_correct field)', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${testQuiz._id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toBe(200);
      
      // Check that is_correct is NOT present in options
      res.body.questions.forEach(question => {
        question.options.forEach(option => {
          expect(option.is_correct).toBeUndefined();
          expect(option.text).toBeDefined(); // text should be present
        });
      });
    });

    test('Should return sanitized quiz data (NO explanation field)', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${testQuiz._id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toBe(200);
      
      // Check that explanation is NOT present
      res.body.questions.forEach(question => {
        expect(question.explanation).toBeUndefined();
      });
    });

    test('Should include all safe quiz metadata', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${testQuiz._id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.questions).toBeDefined();
      expect(res.body.questions.length).toBe(3);
      
      // Check question structure
      res.body.questions.forEach(question => {
        expect(question._id).toBeDefined();
        expect(question.question_text).toBeDefined();
        expect(question.code_snippet).toBeDefined(); // null is ok
        expect(question.type).toBeDefined();
        expect(question.tags).toBeDefined();
        expect(Array.isArray(question.options)).toBe(true);
      });
    });

    test('Should return 404 for non-existent quiz', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/quizzes/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.msg).toBe('Quiz not found');
    });

    test('Should return 401 without authentication token', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${testQuiz._id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toContain('authorization');
    });

    test('Should return 401 with invalid token', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${testQuiz._id}`)
        .set('Authorization', 'Bearer invalid_token');

      expect(res.statusCode).toBe(401);
      expect(res.body.msg).toContain('not valid');
    });
  });

  // ==========================================
  // TEST 2: POST /api/quizzes/:quizId/submit - Submit Quiz
  // ==========================================
  describe('POST /api/quizzes/:quizId/submit', () => {

    test('Should submit quiz successfully with all correct answers', async () => {
      // Get the option IDs for correct answers
      const correctAnswerIds = [
        testQuiz.questions[0].options[1]._id,      // "object" is correct
        testQuiz.questions[1].options[1]._id,      // "False" is correct
        [
          testQuiz.questions[2].options[0]._id,    // forEach is correct
          testQuiz.questions[2].options[1]._id,    // map is correct
          testQuiz.questions[2].options[2]._id     // filter is correct
        ]
      ];

      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: testQuiz.questions[0]._id,
              selectedOptionIds: [correctAnswerIds[0]]
            },
            {
              questionId: testQuiz.questions[1]._id,
              selectedOptionIds: [correctAnswerIds[1]]
            },
            {
              questionId: testQuiz.questions[2]._id,
              selectedOptionIds: correctAnswerIds[2]
            }
          ],
          timeTaken: 120,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.score).toBe(3);
      expect(res.body.maxScore).toBe(3);
      expect(res.body.accuracy).toBe(100);
      expect(res.body.passed).toBe(true);
      expect(res.body.xpEarned).toBeGreaterThan(0);
      expect(res.body.msg).toBe('Quiz passed!');
    });

    test('Should calculate partial score correctly', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: testQuiz.questions[0]._id,
              selectedOptionIds: [testQuiz.questions[0].options[0]._id] // Wrong answer
            },
            {
              questionId: testQuiz.questions[1]._id,
              selectedOptionIds: [testQuiz.questions[1].options[1]._id] // Correct answer
            },
            {
              questionId: testQuiz.questions[2]._id,
              selectedOptionIds: [testQuiz.questions[2].options[3]._id] // Wrong answer
            }
          ],
          timeTaken: 120,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.score).toBe(1);
      expect(res.body.maxScore).toBe(3);
      expect(res.body.accuracy).toBeCloseTo(33.33, 1);
      expect(res.body.passed).toBe(false);
      expect(res.body.xpEarned).toBe(0); // No XP for failure
    });

    test('Should calculate XP with difficulty multiplier', async () => {
      // Create a harder quiz
      const hardQuiz = await Quiz.create({
        title: 'Advanced JavaScript',
        language: 'JavaScript',
        difficulty: 'hard',
        xp_reward: 100,
        timeLimit: 600,
        passingScore: 60,
        questions: [
          {
            question_text: 'What is the time complexity?',
            type: 'single',
            explanation: 'Explanation',
            tags: [],
            options: [
              { text: 'O(n)', is_correct: true },
              { text: 'O(n^2)', is_correct: false }
            ]
          }
        ]
      });

      const res = await request(app)
        .post(`/api/quizzes/${hardQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: hardQuiz.questions[0]._id,
              selectedOptionIds: [hardQuiz.questions[0].options[0]._id]
            }
          ],
          timeTaken: 60,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(201);
      // Hard difficulty multiplier is 2x: 100 * 2 * (100/100) = 200
      expect(res.body.xpEarned).toBe(200);
    });

    test('Should flag quiz when completed too quickly', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: testQuiz.questions[0]._id,
              selectedOptionIds: [testQuiz.questions[0].options[1]._id]
            },
            {
              questionId: testQuiz.questions[1]._id,
              selectedOptionIds: [testQuiz.questions[1].options[1]._id]
            },
            {
              questionId: testQuiz.questions[2]._id,
              selectedOptionIds: [testQuiz.questions[2].options[0]._id]
            }
          ],
          timeTaken: 10, // < 20% of 300 = 60 seconds
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.flagged).toBe(true);
      expect(res.body.flagReason).toBe('Completed too quickly');
    });

    test('Should flag quiz with excessive tab switches', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: testQuiz.questions[0]._id,
              selectedOptionIds: [testQuiz.questions[0].options[1]._id]
            },
            {
              questionId: testQuiz.questions[1]._id,
              selectedOptionIds: [testQuiz.questions[1].options[1]._id]
            },
            {
              questionId: testQuiz.questions[2]._id,
              selectedOptionIds: [testQuiz.questions[2].options[0]._id]
            }
          ],
          timeTaken: 200,
          tabSwitchCount: 10 // > 5 threshold
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.flagged).toBe(true);
      expect(res.body.flagReason).toBe('Excessive tab switching detected');
    });

    test('Should save quiz attempt to database', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: testQuiz.questions[0]._id,
              selectedOptionIds: [testQuiz.questions[0].options[1]._id]
            },
            {
              questionId: testQuiz.questions[1]._id,
              selectedOptionIds: [testQuiz.questions[1].options[1]._id]
            },
            {
              questionId: testQuiz.questions[2]._id,
              selectedOptionIds: [
                testQuiz.questions[2].options[0]._id,
                testQuiz.questions[2].options[1]._id,
                testQuiz.questions[2].options[2]._id
              ]
            }
          ],
          timeTaken: 150,
          tabSwitchCount: 1
        });

      expect(res.statusCode).toBe(201);

      // Verify attempt was saved
      const attempt = await QuizAttempt.findById(res.body.quizAttemptId);
      expect(attempt).not.toBeNull();
      expect(attempt.userId.toString()).toBe(testUser._id.toString());
      expect(attempt.quizId.toString()).toBe(testQuiz._id.toString());
      expect(attempt.score).toBe(3);
      expect(attempt.maxScore).toBe(3);
      expect(attempt.timeTaken).toBe(150);
      expect(attempt.tabSwitchCount).toBe(1);
    });

    test('Should return 400 for invalid answer format', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: 'invalid', // Should be array
          timeTaken: 120,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('array');
    });

    test('Should return 400 for missing timeTaken', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [],
          // missing timeTaken
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('Time taken');
    });

    test('Should return 404 for non-existent quiz', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/quizzes/${fakeId}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [],
          timeTaken: 120,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.msg).toBe('Quiz not found');
    });

    test('Should return 401 without authentication', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .send({
          answers: [],
          timeTaken: 120,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(401);
    });
  });

  // ==========================================
  // TEST 3: Answer Validation Logic
  // ==========================================
  describe('Answer Validation - Question Types', () => {

    test('Single-select question: Should accept one correct option', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: testQuiz.questions[0]._id,
              selectedOptionIds: [testQuiz.questions[0].options[1]._id] // Correct
            }
          ],
          timeTaken: 60,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(201);
      // Should only count first question
      const attempt = await QuizAttempt.findById(res.body.quizAttemptId);
      expect(attempt.answers[0].isCorrect).toBe(true);
    });

    test('Single-select question: Should reject wrong option', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: testQuiz.questions[0]._id,
              selectedOptionIds: [testQuiz.questions[0].options[0]._id] // Wrong
            }
          ],
          timeTaken: 60,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(201);
      const attempt = await QuizAttempt.findById(res.body.quizAttemptId);
      expect(attempt.answers[0].isCorrect).toBe(false);
    });

    test('Multi-select question: Should require ALL correct options', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: testQuiz.questions[2]._id,
              selectedOptionIds: [
                testQuiz.questions[2].options[0]._id, // forEach - correct
                testQuiz.questions[2].options[1]._id  // map - correct
                // Missing filter!
              ]
            }
          ],
          timeTaken: 60,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(201);
      const attempt = await QuizAttempt.findById(res.body.quizAttemptId);
      expect(attempt.answers[0].isCorrect).toBe(false); // Missing one correct option
    });

    test('Multi-select question: Should reject extra incorrect options', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: testQuiz.questions[2]._id,
              selectedOptionIds: [
                testQuiz.questions[2].options[0]._id, // forEach - correct
                testQuiz.questions[2].options[1]._id, // map - correct
                testQuiz.questions[2].options[2]._id, // filter - correct
                testQuiz.questions[2].options[3]._id  // isInteger - WRONG!
              ]
            }
          ],
          timeTaken: 60,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(201);
      const attempt = await QuizAttempt.findById(res.body.quizAttemptId);
      expect(attempt.answers[0].isCorrect).toBe(false); // Has extra wrong option
    });
  });

  // ==========================================
  // TEST 4: Passing Score Logic
  // ==========================================
  describe('Passing Score Calculation', () => {

    test('Should set passed=true when accuracy >= passingScore', async () => {
      // passingScore is 60%, so 60% or higher should pass
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: testQuiz.questions[0]._id,
              selectedOptionIds: [testQuiz.questions[0].options[1]._id] // Correct
            },
            {
              questionId: testQuiz.questions[1]._id,
              selectedOptionIds: [testQuiz.questions[1].options[1]._id] // Correct
            },
            {
              questionId: testQuiz.questions[2]._id,
              selectedOptionIds: [testQuiz.questions[2].options[3]._id] // Wrong
            }
          ],
          timeTaken: 120,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.passed).toBe(true); // 2/3 = 66.67% >= 60%
    });

    test('Should set passed=false when accuracy < passingScore', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/submit`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          answers: [
            {
              questionId: testQuiz.questions[0]._id,
              selectedOptionIds: [testQuiz.questions[0].options[0]._id] // Wrong
            },
            {
              questionId: testQuiz.questions[1]._id,
              selectedOptionIds: [testQuiz.questions[1].options[0]._id] // Wrong
            },
            {
              questionId: testQuiz.questions[2]._id,
              selectedOptionIds: [testQuiz.questions[2].options[3]._id] // Wrong
            }
          ],
          timeTaken: 120,
          tabSwitchCount: 0
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.passed).toBe(false); // 0/3 = 0% < 60%
    });
  });
});

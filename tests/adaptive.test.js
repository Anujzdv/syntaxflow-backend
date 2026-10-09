require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const { app } = require('../server');
const AdaptiveSession = require('../models/AdaptiveSession');

describe('Adaptive Practice Mode API Tests', () => {
  let userToken;
  let otherUserToken;
  let userId;

  beforeAll(async () => {
    // Register primary test user
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Adaptive Tester',
        email: 'adaptive@test.com',
        password: 'password123'
      });
    userToken = res1.body.token;
    userId = res1.body.user?._id || res1.body.user?.id;

    // Register second test user for authorization tests
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Other Tester',
        email: 'other_adaptive@test.com',
        password: 'password123'
      });
    otherUserToken = res2.body.token;
  });

  describe('POST /api/quizzes/adaptive/sessions (Start Session)', () => {
    test('rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/quizzes/adaptive/sessions')
        .send({ language: 'JavaScript' });

      expect(res.status).toBe(401);
    });

    test('validates required language field with 400', async () => {
      const res = await request(app)
        .post('/api/quizzes/adaptive/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('language is required');
    });

    test('creates a session and returns a safe question DTO without answer leakage', async () => {
      const res = await request(app)
        .post('/api/quizzes/adaptive/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          language: 'JavaScript',
          topic: 'basics',
          startingDifficulty: 'easy'
        });

      expect(res.status).toBe(201);
      expect(res.body.sessionId).toBeDefined();
      expect(res.body.currentDifficulty).toBe('easy');
      expect(res.body.question).toBeDefined();

      const q = res.body.question;
      expect(q.id).toBeDefined();
      expect(q.questionText).toBeDefined();
      expect(q.options).toHaveLength(4);

      // SECURITY AUDIT: Verify no answer leakage
      expect(q.correctOptionId).toBeUndefined();
      expect(q.is_correct).toBeUndefined();
      expect(q.explanation).toBeUndefined();
    });
  });

  describe('POST /api/quizzes/adaptive/sessions/:sessionId/answers (Submit Answer)', () => {
    let activeSessionId;
    let initialQuestion;

    beforeEach(async () => {
      const startRes = await request(app)
        .post('/api/quizzes/adaptive/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          language: 'JavaScript',
          topic: 'basics',
          startingDifficulty: 'easy'
        });

      activeSessionId = startRes.body.sessionId;
      initialQuestion = startRes.body.question;
    });

    test('prevents other users from submitting answers (403)', async () => {
      const res = await request(app)
        .post(`/api/quizzes/adaptive/sessions/${activeSessionId}/answers`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          questionId: initialQuestion.id,
          selectedOptionId: 'A'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    test('validates required payload parameters with 400', async () => {
      const res = await request(app)
        .post(`/api/quizzes/adaptive/sessions/${activeSessionId}/answers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ questionId: initialQuestion.id });

      expect(res.status).toBe(400);
    });

    test('grades correctly and returns server-derived result and next question', async () => {
      // Find server-side correct option from DB directly to test true path
      const sessionDoc = await AdaptiveSession.findById(activeSessionId);
      const correctOpt = sessionDoc.currentQuestion.correctOptionId;

      const res = await request(app)
        .post(`/api/quizzes/adaptive/sessions/${activeSessionId}/answers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questionId: initialQuestion.id,
          selectedOptionId: correctOpt,
          idempotencyKey: 'idem-key-1'
        });

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      expect(res.body.result.isCorrect).toBe(true);
      expect(res.body.result.correctOptionId).toBe(correctOpt);
      expect(res.body.result.explanation).toBeDefined();
      expect(res.body.adaptation).toBeDefined();
      expect(res.body.stats.totalAnswered).toBe(1);
      expect(res.body.stats.totalCorrect).toBe(1);
      expect(res.body.stats.accuracy).toBe(100);
    });

    test('rejects duplicate submission with idempotency key (409)', async () => {
      const sessionDoc = await AdaptiveSession.findById(activeSessionId);
      const correctOpt = sessionDoc.currentQuestion.correctOptionId;

      // First submission
      await request(app)
        .post(`/api/quizzes/adaptive/sessions/${activeSessionId}/answers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questionId: initialQuestion.id,
          selectedOptionId: correctOpt,
          idempotencyKey: 'idem-duplicate-test'
        });

      // Second duplicate submission
      const dupeRes = await request(app)
        .post(`/api/quizzes/adaptive/sessions/${activeSessionId}/answers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questionId: initialQuestion.id,
          selectedOptionId: correctOpt,
          idempotencyKey: 'idem-duplicate-test'
        });

      expect(dupeRes.status).toBe(409);
      expect(dupeRes.body.message).toContain('Duplicate submission');
    });

    test('adapts difficulty upwards after 2 consecutive correct answers', async () => {
      // Question 1: Answer correct
      const doc1 = await AdaptiveSession.findById(activeSessionId);
      const res1 = await request(app)
        .post(`/api/quizzes/adaptive/sessions/${activeSessionId}/answers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questionId: doc1.currentQuestion.id,
          selectedOptionId: doc1.currentQuestion.correctOptionId
        });

      expect(res1.body.result.isCorrect).toBe(true);
      expect(res1.body.adaptation.change).toBe('maintain'); // 1 correct: maintain

      // Question 2: Answer correct
      const doc2 = await AdaptiveSession.findById(activeSessionId);
      if (doc2.currentQuestion) {
        const res2 = await request(app)
          .post(`/api/quizzes/adaptive/sessions/${activeSessionId}/answers`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            questionId: doc2.currentQuestion.id,
            selectedOptionId: doc2.currentQuestion.correctOptionId
          });

        expect(res2.body.result.isCorrect).toBe(true);
        expect(res2.body.adaptation.change).toBe('increase'); // 2 consecutive correct: increase
        expect(res2.body.adaptation.nextDifficulty).toBe('medium');
      }
    });
  });

  describe('GET /api/quizzes/adaptive/sessions/:sessionId/summary', () => {
    test('returns session stats and recommendations', async () => {
      const startRes = await request(app)
        .post('/api/quizzes/adaptive/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          language: 'Python',
          topic: 'basics',
          startingDifficulty: 'easy'
        });

      const sessionId = startRes.body.sessionId;

      const summaryRes = await request(app)
        .get(`/api/quizzes/adaptive/sessions/${sessionId}/summary`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.sessionId).toBe(sessionId);
      expect(summaryRes.body.language).toBe('Python');
      expect(summaryRes.body.totalAnswered).toBe(0);
      expect(summaryRes.body.recommendation).toBeDefined();
    });

    test('rejects access from another user (403)', async () => {
      const startRes = await request(app)
        .post('/api/quizzes/adaptive/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ language: 'Python' });

      const res = await request(app)
        .get(`/api/quizzes/adaptive/sessions/${startRes.body.sessionId}/summary`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/quizzes/adaptive/sessions/:sessionId/finish', () => {
    test('finishes session and rejects further answers', async () => {
      const startRes = await request(app)
        .post('/api/quizzes/adaptive/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ language: 'Java' });

      const sessionId = startRes.body.sessionId;
      const questionId = startRes.body.question.id;

      // Finish session
      const finishRes = await request(app)
        .post(`/api/quizzes/adaptive/sessions/${sessionId}/finish`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(finishRes.status).toBe(200);
      expect(finishRes.body.status).toBe('completed');

      // Subsequent attempt should be rejected
      const submitRes = await request(app)
        .post(`/api/quizzes/adaptive/sessions/${sessionId}/answers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questionId,
          selectedOptionId: 'A'
        });

      expect(submitRes.status).toBe(400);
      expect(submitRes.body.message).toContain('already completed');
    });
  });
});

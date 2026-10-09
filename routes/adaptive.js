const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const AdaptiveSession = require('../models/AdaptiveSession');
const { adjustDifficulty, normalizeDifficulty } = require('../utils/adaptiveEngine');
const { selectNextQuestion, serializeQuestionForClient } = require('../services/adaptiveQuestionService');

/**
 * @route   POST /api/quizzes/adaptive/sessions
 * @desc    Start an adaptive practice session
 * @access  Private
 */
router.post('/sessions', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { language, topic = 'general', startingDifficulty = 'medium' } = req.body;

    if (!language || typeof language !== 'string') {
      return res.status(400).json({ message: 'A valid programming language is required.' });
    }

    const initialDifficulty = normalizeDifficulty(startingDifficulty);

    // Select the first question
    const firstQuestion = await selectNextQuestion({
      language,
      topic,
      difficulty: initialDifficulty,
      usedQuestionIds: []
    });

    if (!firstQuestion) {
      return res.status(404).json({
        message: `No practice questions available for language '${language}'.`
      });
    }

    const session = new AdaptiveSession({
      userId,
      language: firstQuestion.language,
      topic,
      currentDifficulty: initialDifficulty,
      status: 'active',
      usedQuestionIds: [firstQuestion.id],
      currentQuestion: firstQuestion
    });

    await session.save();

    res.status(201).json({
      sessionId: session._id,
      currentDifficulty: session.currentDifficulty,
      question: serializeQuestionForClient(firstQuestion)
    });
  } catch (err) {
    console.error('Error starting adaptive session:', err);
    res.status(500).json({ message: 'Failed to start adaptive practice session.' });
  }
});

/**
 * @route   POST /api/quizzes/adaptive/sessions/:sessionId/answers
 * @desc    Submit an answer, adapt difficulty, receive next question
 * @access  Private
 */
router.post('/sessions/:sessionId/answers', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id || req.user._id;
    const { questionId, selectedOptionId, idempotencyKey } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID format.' });
    }

    if (!questionId || !selectedOptionId) {
      return res.status(400).json({ message: 'questionId and selectedOptionId are required.' });
    }

    const session = await AdaptiveSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Adaptive session not found.' });
    }

    // Verify ownership
    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied to this adaptive session.' });
    }

    // Prevent answering after completion
    if (session.status !== 'active') {
      return res.status(400).json({ message: 'This practice session is already completed.' });
    }

    // Idempotency check
    if (idempotencyKey) {
      if (session.idempotencyKeys.includes(idempotencyKey)) {
        return res.status(409).json({ message: 'Duplicate submission detected for this answer.' });
      }
      session.idempotencyKeys.push(idempotencyKey);
    }

    const activeQuestion = session.currentQuestion;

    if (!activeQuestion || activeQuestion.id !== questionId) {
      return res.status(400).json({ message: 'Submitted question does not match the active session question.' });
    }

    // Authoritative grading
    const isCorrect = String(activeQuestion.correctOptionId).trim().toUpperCase() === String(selectedOptionId).trim().toUpperCase();

    // Update counts
    session.totalAnswered += 1;
    if (isCorrect) {
      session.totalCorrect += 1;
      session.consecutiveCorrect += 1;
      session.consecutiveIncorrect = 0;
    } else {
      session.consecutiveIncorrect += 1;
      session.consecutiveCorrect = 0;
    }

    // Record in history
    session.history.push({
      questionId: activeQuestion.id,
      selectedOptionId,
      correctOptionId: activeQuestion.correctOptionId,
      isCorrect,
      difficulty: activeQuestion.difficulty,
      source: activeQuestion.source || 'curated',
      answeredAt: new Date()
    });

    // Run deterministic adaptive engine
    const previousDifficulty = session.currentDifficulty;
    const adaptation = adjustDifficulty({
      currentDifficulty: session.currentDifficulty,
      recentOutcomes: session.history.map(h => ({ isCorrect: h.isCorrect }))
    });

    if (adaptation.streakReset) {
      session.consecutiveCorrect = 0;
      session.consecutiveIncorrect = 0;
    }

    session.currentDifficulty = adaptation.nextDifficulty;

    // Fetch next question
    const nextQuestion = await selectNextQuestion({
      language: session.language,
      topic: session.topic,
      difficulty: session.currentDifficulty,
      usedQuestionIds: session.usedQuestionIds
    });

    if (nextQuestion) {
      session.usedQuestionIds.push(nextQuestion.id);
      session.currentQuestion = nextQuestion;
    } else {
      // Practice pool exhausted
      session.currentQuestion = null;
      session.status = 'completed';
      session.completedAt = new Date();
    }

    await session.save();

    res.json({
      result: {
        isCorrect,
        explanation: activeQuestion.explanation,
        correctOptionId: activeQuestion.correctOptionId
      },
      adaptation: {
        previousDifficulty,
        nextDifficulty: session.currentDifficulty,
        change: adaptation.change,
        reason: adaptation.reason
      },
      nextQuestion: nextQuestion ? serializeQuestionForClient(nextQuestion) : null,
      sessionStatus: session.status,
      stats: {
        totalAnswered: session.totalAnswered,
        totalCorrect: session.totalCorrect,
        accuracy: session.totalAnswered > 0 ? Math.round((session.totalCorrect / session.totalAnswered) * 100) : 0
      }
    });
  } catch (err) {
    console.error('Error grading adaptive answer:', err);
    res.status(500).json({ message: 'Failed to process answer.' });
  }
});

/**
 * @route   GET /api/quizzes/adaptive/sessions/:sessionId/summary
 * @desc    Get session summary, accuracy, difficulty transitions and recommendations
 * @access  Private
 */
router.get('/sessions/:sessionId/summary', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID format.' });
    }

    const session = await AdaptiveSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Adaptive session not found.' });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied to this adaptive session.' });
    }

    const accuracy = session.totalAnswered > 0 
      ? Math.round((session.totalCorrect / session.totalAnswered) * 100) 
      : 0;

    let recommendation = 'Keep practicing to reinforce your fundamental concepts.';
    if (accuracy >= 80 && session.currentDifficulty === 'hard') {
      recommendation = 'Outstanding performance! You have mastered hard-tier concepts for this topic.';
    } else if (accuracy >= 70) {
      recommendation = 'Strong performance! Challenge yourself with advanced questions and timed quizzes.';
    } else if (accuracy < 50) {
      recommendation = 'Review foundational documentation and re-attempt practice at easy or medium difficulty.';
    }

    res.json({
      sessionId: session._id,
      language: session.language,
      topic: session.topic,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      currentDifficulty: session.currentDifficulty,
      totalAnswered: session.totalAnswered,
      totalCorrect: session.totalCorrect,
      accuracy,
      difficultyProgression: session.history.map(h => ({
        difficulty: h.difficulty,
        isCorrect: h.isCorrect,
        answeredAt: h.answeredAt
      })),
      recommendation
    });
  } catch (err) {
    console.error('Error fetching adaptive summary:', err);
    res.status(500).json({ message: 'Failed to fetch adaptive session summary.' });
  }
});

/**
 * @route   POST /api/quizzes/adaptive/sessions/:sessionId/finish
 * @desc    Finish an active practice session early
 * @access  Private
 */
router.post('/sessions/:sessionId/finish', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID format.' });
    }

    const session = await AdaptiveSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Adaptive session not found.' });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied to this adaptive session.' });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    res.json({
      message: 'Session completed successfully.',
      sessionId: session._id,
      status: session.status,
      totalAnswered: session.totalAnswered,
      totalCorrect: session.totalCorrect
    });
  } catch (err) {
    console.error('Error finishing adaptive session:', err);
    res.status(500).json({ message: 'Failed to finish session.' });
  }
});

module.exports = router;

// routes/quiz.js
const express = require('express');
const router = express.Router(); // <--- Creates the router
const auth = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const QuizAttempt = require('../models/QuizAttempt');
const mongoose = require('mongoose');

// ============================================
// HELPER FUNCTION: Resolve Quiz by ID or Language Slug
// ============================================
// Supports both MongoDB ObjectId (24 hex chars) and language slugs (e.g., "python", "javascript")
async function resolveQuiz(identifier) {
  // Check if identifier is a valid MongoDB ObjectId (24 hex characters)
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(identifier);

  let quiz;
  if (isMongoId) {
    // Look up by MongoDB _id
    quiz = await Quiz.findById(identifier);
  } else {
    // Treat as language slug (case-insensitive lookup)
    // Get the latest quiz for that language
    quiz = await Quiz.findOne({
      language: { $regex: new RegExp(`^${identifier}$`, 'i') }
    }).sort({ createdAt: -1 });
  }

  return quiz;
}

// ============================================
// NEW QUIZ ENGINE ROUTES (v2)
// ============================================

// --- Get Single Quiz by ID or Language Slug (Sanitized) ---
// @route   GET /api/quizzes/:identifier
// @desc    Fetch a quiz by ObjectId OR language slug with sanitized data (no correct answers/explanations)
// @param   identifier can be: MongoDB ObjectId or language slug (e.g., "python", "javascript")
// @access  Private (Requires login)
router.get('/:identifier', auth, async (req, res) => {
  try {
    const { identifier } = req.params;

    // Fetch quiz from database using helper (supports both ObjectId and language slug)
    const quiz = await resolveQuiz(identifier);

    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }

    // CRITICAL SECURITY: Remove is_correct and explanation from questions/options
    const sanitizedQuiz = {
      _id: quiz._id,
      title: quiz.title,
      language: quiz.language,
      difficulty: quiz.difficulty,
      timeLimit: quiz.timeLimit,
      xp_reward: quiz.xp_reward,
      questions: quiz.questions.map(question => ({
        _id: question._id,
        question_text: question.question_text,
        code_snippet: question.code_snippet,
        type: question.type,
        tags: question.tags,
        options: question.options.map(option => ({
          _id: option._id,
          text: option.text,
          // SECURITY: Do NOT send is_correct
        })),
        // SECURITY: Do NOT send explanation
      })),
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    };

    res.json(sanitizedQuiz);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// --- Submit Quiz Answers (New Implementation) ---
// @route   POST /api/quizzes/:identifier/submit
// @desc    Submit quiz answers, calculate score, and save attempt
// @param   identifier can be: MongoDB ObjectId or language slug (e.g., "python", "javascript")
// @access  Private
router.post('/:identifier/submit', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { answers, timeTaken, tabSwitchCount } = req.body;

    // Validation
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ msg: 'Answers must be an array' });
    }

    if (!timeTaken || typeof timeTaken !== 'number') {
      return res.status(400).json({ msg: 'Time taken must be a number' });
    }

    // Fetch the quiz using helper (supports both ObjectId and language slug)
    const quiz = await resolveQuiz(identifier);
    if (!quiz) {
      return res.status(404).json({ msg: 'Quiz not found' });
    }

    // Build a map of questions with their correct options
    const questionMap = {};
    quiz.questions.forEach(question => {
      questionMap[question._id.toString()] = {
        type: question.type,
        correctOptions: question.options
          .filter(opt => opt.is_correct)
          .map(opt => opt._id.toString()),
      };
    });

    // Calculate score
    let correctCount = 0;
    let processedAnswers = [];

    answers.forEach(answer => {
      const questionId = answer.questionId.toString();
      const selectedIds = answer.selectedOptionIds.map(id => id.toString());

      const question = questionMap[questionId];
      if (!question) {
        console.warn(`Question ${questionId} not found in quiz`);
        return;
      }

      // Check if answer is correct
      let isCorrect = false;

      if (question.type === 'single' || question.type === 'true_false') {
        // Single answer: must match exactly one correct option
        isCorrect = 
          selectedIds.length === 1 && 
          question.correctOptions.length === 1 &&
          selectedIds[0] === question.correctOptions[0];
      } else if (question.type === 'multi') {
        // Multiple answers: must match all correct options exactly
        isCorrect = 
          selectedIds.length === question.correctOptions.length &&
          selectedIds.every(id => question.correctOptions.includes(id));
      }

      if (isCorrect) {
        correctCount++;
      }

      processedAnswers.push({
        questionId: answer.questionId,
        selectedOptionIds: answer.selectedOptionIds,
        isCorrect: isCorrect,
      });
    });

    // Calculate scoring
    const maxScore = quiz.questions.length;
    const score = correctCount;
    const accuracy = maxScore > 0 ? (correctCount / maxScore) * 100 : 0;
    const passed = accuracy >= (quiz.passingScore || 60);

    // Calculate XP earned
    let xpEarned = 0;
    if (passed) {
      // Award XP based on difficulty and accuracy
      const difficultyMultiplier = {
        easy: 1,
        medium: 1.5,
        hard: 2,
      };
      const multiplier = difficultyMultiplier[quiz.difficulty] || 1;
      xpEarned = Math.round((quiz.xp_reward || 100) * multiplier * (accuracy / 100));
    }

    // Detect suspicious behavior (flagging)
    let flagged = false;
    let flagReason = null;

    if (timeTaken < quiz.timeLimit * 0.2) {
      flagged = true;
      flagReason = 'Completed too quickly';
    }

    if (tabSwitchCount && tabSwitchCount > 5) {
      flagged = true;
      flagReason = 'Excessive tab switching detected';
    }

    // Create and save quiz attempt
    const quizAttempt = new QuizAttempt({
      userId: req.user.id,
      quizId: quiz._id,  // Always use the actual quiz ObjectId
      answers: processedAnswers,
      score: score,
      maxScore: maxScore,
      accuracy: parseFloat(accuracy.toFixed(2)),
      xpEarned: xpEarned,
      timeTaken: timeTaken,
      flagged: flagged,
      flagReason: flagReason,
      tabSwitchCount: tabSwitchCount || 0,
      passed: passed,
    });

    await quizAttempt.save();

    // Send response
    res.status(201).json({
      success: true,
      quizAttemptId: quizAttempt._id,
      score: score,
      maxScore: maxScore,
      accuracy: quizAttempt.accuracy,
      passed: passed,
      xpEarned: xpEarned,
      timeTaken: timeTaken,
      flagged: flagged,
      flagReason: flagReason,
      msg: passed ? 'Quiz passed!' : 'Quiz submitted successfully',
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// ============================================
// LEGACY QUIZ ROUTES (v1) - Keep for compatibility
// ============================================

// @route   GET /api/quiz/:language
// @desc    Get 10 random quiz questions for a specific language
// @access  Private (Requires login)
router.get('/:language', auth, async (req, res) => { // <--- Uses router.get
  try {
    const language = req.params.language;
    // Use aggregate pipeline to get 10 random questions
    const questions = await Quiz.aggregate([
      { $match: { language: language } }, // Filter by language
      { $sample: { size: 10 } }          // Get 10 random documents
    ]);

    if (!questions || questions.length === 0) {
      return res.status(404).json({ msg: 'No quiz questions found for this language' });
    }

    // Don't send the correct answer to the client
    const questionsForClient = questions.map(q => {
      const { correctAnswer, ...question } = q; // Destructure to remove correctAnswer
      return question;
    });

    res.json(questionsForClient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Submit Quiz Answers (UPDATED) ---
// @route   POST /api/quiz/submit
// @desc    Submit answers, get score, and save results
// @access  Private
router.post('/submit', auth, async (req, res) => { // <--- Uses router.post
  const { language, answers, timeTaken } = req.body;
  // 'answers' should be an array of objects: [{ questionId: '...', answer: 0 }, ...]

  try {
    const questionIds = answers.map(a => a.questionId);

    // 1. Get the correct answers from the database
    const correctQuestions = await Quiz.find({
      _id: { $in: questionIds }
    }).select('_id correctAnswer');

    // Create a map for easy lookup
    const answerMap = {};
    correctQuestions.forEach(q => {
      answerMap[q._id.toString()] = q.correctAnswer;
    });

    // 2. Calculate the score AND build a results array
    let score = 0;
    let correctAnswersCount = 0;
    const totalQuestions = answers.length;

    // --- NEW: This array will store the detailed results ---
    const detailedResults = [];

    answers.forEach(answer => {
      // Handle cases where a question might not be found in the DB (shouldn't happen, but good practice)
      if (answerMap[answer.questionId] === undefined) {
         detailedResults.push({
           questionId: answer.questionId,
           yourAnswer: answer.answer,
           correctAnswer: null, // Mark as unknown
           isCorrect: false
         });
         return; // Skip this answer if the question wasn't found
      }

      const isCorrect = answerMap[answer.questionId] === answer.answer;
      if (isCorrect) {
        correctAnswersCount++;
        score += 10; // 10 points per correct answer
      }
      // Add details for this question to our results array
      detailedResults.push({
        questionId: answer.questionId,
        yourAnswer: answer.answer,
        correctAnswer: answerMap[answer.questionId],
        isCorrect: isCorrect
      });
    });

    const accuracy = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;

    // 3. Save the result to the database
    const newResult = new QuizResult({
      user: req.user.id,
      language,
      score,
      correctAnswers: correctAnswersCount,
      totalQuestions,
      timeTaken,
      accuracy: parseFloat(accuracy.toFixed(2)),
    });

    await newResult.save();

    // 4. Send the ENTIRE result object back to the user
    res.status(201).json({
      score,
      correctAnswers: correctAnswersCount,
      totalQuestions,
      timeTaken,
      accuracy: newResult.accuracy,
      // --- NEW: Send the detailed results back ---
      detailedResults: detailedResults,
      msg: 'Quiz submitted successfully!'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; // <--- Exports the router

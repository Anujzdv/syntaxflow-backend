// routes/quiz.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');

// --- Get Quiz Questions by Language ---
// @route   GET /api/quiz/:language
// @desc    Get 10 random quiz questions for a specific language
// @access  Private (Requires login)
router.get('/:language', auth, async (req, res) => {
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

// --- Submit Quiz Answers ---
// @route   POST /api/quiz/submit
// @desc    Submit answers, get score, and save results
// @access  Private
router.post('/submit', auth, async (req, res) => {
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

    // 2. Calculate the score
    let score = 0;
    let correctAnswersCount = 0;
    const totalQuestions = answers.length;

    answers.forEach(answer => {
      if (answerMap[answer.questionId] === answer.answer) {
        correctAnswersCount++;
        score += 10; // 10 points per correct answer
      }
    });
    
    const accuracy = (correctAnswersCount / totalQuestions) * 100;

    // 3. Save the result to the database
    const newResult = new QuizResult({
      user: req.user.id,
      language,
      score,
      correctAnswers: correctAnswersCount,
      totalQuestions,
      timeTaken,
      accuracy: parseFloat(accuracy.toFixed(2)), // Store with 2 decimal places
    });

    await newResult.save();

    // 4. Send the result back to the user
    res.status(201).json({
      score,
      correctAnswers: correctAnswersCount,
      totalQuestions,
      timeTaken,
      accuracy: newResult.accuracy,
      msg: 'Quiz submitted successfully!'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
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
// FALLBACK: Sample Quiz Data (Demo Mode)
// ============================================
const getFallbackQuiz = (language) => {
  const fallbackQuizzes = {
    javascript: {
      _id: 'demo-js-001',
      title: 'JavaScript Fundamentals',
      language: 'JavaScript',
      difficulty: 'easy',
      timeLimit: 600,
      xp_reward: 100,
      questions: [
        {
          _id: 'q1',
          question_text: 'What symbol is used for "strict equality"?',
          code_snippet: 'if (5 === "5") { } // false',
          type: 'single',
          tags: ['operators', 'equality'],
          options: [
            { _id: 'o1', text: '==', is_correct: false },
            { _id: 'o2', text: '===', is_correct: true },
            { _id: 'o3', text: '=', is_correct: false },
            { _id: 'o4', text: '!=', is_correct: false },
          ]
        },
        {
          _id: 'q2',
          question_text: 'How do you declare a variable?',
          code_snippet: 'let x = 10;',
          type: 'single',
          tags: ['variables'],
          options: [
            { _id: 'o1', text: 'let x = 10;', is_correct: true },
            { _id: 'o2', text: 'var x = 10;', is_correct: false },
            { _id: 'o3', text: 'const x = 10;', is_correct: false },
            { _id: 'o4', text: 'declare x = 10;', is_correct: false },
          ]
        },
        {
          _id: 'q3',
          question_text: 'Which are valid array methods?',
          code_snippet: 'arr.map(), arr.filter(), arr.forEach()',
          type: 'multi',
          tags: ['arrays'],
          options: [
            { _id: 'o1', text: 'map()', is_correct: true },
            { _id: 'o2', text: 'filter()', is_correct: true },
            { _id: 'o3', text: 'multiply()', is_correct: false },
            { _id: 'o4', text: 'forEach()', is_correct: true },
          ]
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    python: {
      _id: 'demo-py-001',
      title: 'Python Fundamentals',
      language: 'Python',
      difficulty: 'easy',
      timeLimit: 600,
      xp_reward: 100,
      questions: [
        {
          _id: 'q1',
          question_text: 'How do you write a comment?',
          code_snippet: '# This is a comment',
          type: 'single',
          tags: ['syntax'],
          options: [
            { _id: 'o1', text: '// Comment', is_correct: false },
            { _id: 'o2', text: '# Comment', is_correct: true },
            { _id: 'o3', text: '/* Comment */', is_correct: false },
            { _id: 'o4', text: '-- Comment', is_correct: false },
          ]
        },
        {
          _id: 'q2',
          question_text: 'How do you define a function?',
          code_snippet: 'def greet(name):\n    return "Hello"',
          type: 'single',
          tags: ['functions'],
          options: [
            { _id: 'o1', text: 'def greet():', is_correct: true },
            { _id: 'o2', text: 'function greet():', is_correct: false },
            { _id: 'o3', text: 'fun greet():', is_correct: false },
            { _id: 'o4', text: 'define greet():', is_correct: false },
          ]
        },
        {
          _id: 'q3',
          question_text: 'What does len() do?',
          code_snippet: 'len([1, 2, 3, 4, 5])',
          type: 'single',
          tags: ['functions'],
          options: [
            { _id: 'o1', text: 'Returns the length', is_correct: true },
            { _id: 'o2', text: 'Deletes elements', is_correct: false },
            { _id: 'o3', text: 'Sorts the list', is_correct: false },
            { _id: 'o4', text: 'Reverses the list', is_correct: false },
          ]
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    java: {
      _id: 'demo-java-001',
      title: 'Java Fundamentals',
      language: 'Java',
      difficulty: 'easy',
      timeLimit: 600,
      xp_reward: 100,
      questions: [
        {
          _id: 'q1',
          question_text: 'What is the correct file extension?',
          code_snippet: 'public class Hello { }',
          type: 'single',
          tags: ['syntax'],
          options: [
            { _id: 'o1', text: '.java', is_correct: true },
            { _id: 'o2', text: '.class', is_correct: false },
            { _id: 'o3', text: '.jav', is_correct: false },
            { _id: 'o4', text: '.j', is_correct: false },
          ]
        },
        {
          _id: 'q2',
          question_text: 'How do you print to console?',
          code_snippet: 'System.out.println("Hello");',
          type: 'single',
          tags: ['io'],
          options: [
            { _id: 'o1', text: 'printf("x")', is_correct: false },
            { _id: 'o2', text: 'System.out.println()', is_correct: true },
            { _id: 'o3', text: 'print()', is_correct: false },
            { _id: 'o4', text: 'echo()', is_correct: false },
          ]
        },
        {
          _id: 'q3',
          question_text: 'Is Java compiled or interpreted?',
          code_snippet: 'javac Hello.java',
          type: 'true_false',
          tags: ['compilation'],
          options: [
            { _id: 'o1', text: 'True', is_correct: true },
            { _id: 'o2', text: 'False', is_correct: false },
          ]
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'c++': {
      _id: 'demo-cpp-001',
      title: 'C++ Fundamentals',
      language: 'C++',
      difficulty: 'easy',
      timeLimit: 600,
      xp_reward: 100,
      questions: [
        {
          _id: 'q1',
          question_text: 'Which header for input/output?',
          code_snippet: '#include <iostream>',
          type: 'single',
          tags: ['headers'],
          options: [
            { _id: 'o1', text: '<stdio.h>', is_correct: false },
            { _id: 'o2', text: '<iostream>', is_correct: true },
            { _id: 'o3', text: '<string>', is_correct: false },
            { _id: 'o4', text: '<math.h>', is_correct: false },
          ]
        },
        {
          _id: 'q2',
          question_text: 'How do you print?',
          code_snippet: 'cout << "Hello";',
          type: 'single',
          tags: ['io'],
          options: [
            { _id: 'o1', text: 'printf()', is_correct: false },
            { _id: 'o2', text: 'cout <<', is_correct: true },
            { _id: 'o3', text: 'print()', is_correct: false },
            { _id: 'o4', text: 'display()', is_correct: false },
          ]
        },
        {
          _id: 'q3',
          question_text: 'What ends every statement?',
          code_snippet: 'int x = 5;',
          type: 'single',
          tags: ['syntax'],
          options: [
            { _id: 'o1', text: 'Semicolon ;', is_correct: true },
            { _id: 'o2', text: 'Period .', is_correct: false },
            { _id: 'o3', text: 'Colon :', is_correct: false },
            { _id: 'o4', text: 'Nothing', is_correct: false },
          ]
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    c: {
      _id: 'demo-c-001',
      title: 'C Fundamentals',
      language: 'C',
      difficulty: 'easy',
      timeLimit: 600,
      xp_reward: 100,
      questions: [
        {
          _id: 'q1',
          question_text: 'Which header for printf?',
          code_snippet: '#include <stdio.h>',
          type: 'single',
          tags: ['headers'],
          options: [
            { _id: 'o1', text: '<iostream>', is_correct: false },
            { _id: 'o2', text: '<stdlib.h>', is_correct: false },
            { _id: 'o3', text: '<stdio.h>', is_correct: true },
            { _id: 'o4', text: '<string.h>', is_correct: false },
          ]
        },
        {
          _id: 'q2',
          question_text: 'How do you print?',
          code_snippet: 'printf("Hello\\n");',
          type: 'single',
          tags: ['io'],
          options: [
            { _id: 'o1', text: 'printf()', is_correct: true },
            { _id: 'o2', text: 'cout <<', is_correct: false },
            { _id: 'o3', text: 'print()', is_correct: false },
            { _id: 'o4', text: 'puts()', is_correct: false },
          ]
        },
        {
          _id: 'q3',
          question_text: 'What ends statements?',
          code_snippet: 'int x = 10;',
          type: 'single',
          tags: ['syntax'],
          options: [
            { _id: 'o1', text: 'Semicolon ;', is_correct: true },
            { _id: 'o2', text: 'Colon :', is_correct: false },
            { _id: 'o3', text: 'Period .', is_correct: false },
            { _id: 'o4', text: 'Comma ,', is_correct: false },
          ]
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  return fallbackQuizzes[language.toLowerCase()] || null;
};

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
    let quiz = await resolveQuiz(identifier);

    // If not found in DB, try fallback demo data
    if (!quiz) {
      quiz = getFallbackQuiz(identifier);
      if (!quiz) {
        return res.status(404).json({ msg: 'Quiz not found' });
      }
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
    
    // If there's an error querying DB, try fallback demo data
    const identifier = req.params.identifier;
    const fallbackQuiz = getFallbackQuiz(identifier);
    
    if (fallbackQuiz) {
      const sanitizedQuiz = {
        _id: fallbackQuiz._id,
        title: fallbackQuiz.title,
        language: fallbackQuiz.language,
        difficulty: fallbackQuiz.difficulty,
        timeLimit: fallbackQuiz.timeLimit,
        xp_reward: fallbackQuiz.xp_reward,
        questions: fallbackQuiz.questions.map(question => ({
          _id: question._id,
          question_text: question.question_text,
          code_snippet: question.code_snippet,
          type: question.type,
          tags: question.tags,
          options: question.options.map(option => ({
            _id: option._id,
            text: option.text,
          })),
        })),
        createdAt: fallbackQuiz.createdAt,
        updatedAt: fallbackQuiz.updatedAt,
      };
      return res.json(sanitizedQuiz);
    }
    
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

      // Convert to ObjectIds for database storage
      processedAnswers.push({
        questionId: new mongoose.Types.ObjectId(answer.questionId),
        selectedOptionIds: answer.selectedOptionIds.map(id => new mongoose.Types.ObjectId(id)),
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


module.exports = router; // <--- Exports the router

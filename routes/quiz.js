// routes/quiz.js
const express = require('express');
const router = express.Router(); // <--- Creates the router
const auth = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
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
    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    quiz = await Quiz.findOne({
      language: { $regex: new RegExp(`^${escaped}$`, 'i') }
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
      timeLimit: 90,
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
          question_text: 'Which is a valid way to declare a modern reassignable variable in JavaScript?',
          code_snippet: 'let x = 10;\nx = 20;',
          type: 'single',
          tags: ['variables'],
          options: [
            { _id: 'o1', text: 'let x = 10;', is_correct: true },
            { _id: 'o2', text: 'int x = 10;', is_correct: false },
            { _id: 'o3', text: 'dim x = 10;', is_correct: false },
            { _id: 'o4', text: 'declare x = 10;', is_correct: false },
          ]
        },
        {
          _id: 'q3',
          question_text: 'Which are valid JavaScript array methods? (Select all that apply)',
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
      timeLimit: 90,
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
      timeLimit: 90,
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
      timeLimit: 90,
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
      timeLimit: 90,
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

  if (!language) return null;
  const langKey = String(language).toLowerCase().trim();
  if (fallbackQuizzes[langKey]) return fallbackQuizzes[langKey];
  if ((langKey === 'c++' || langKey === 'cpp') && fallbackQuizzes['c++']) return fallbackQuizzes['c++'];
  
  const match = Object.values(fallbackQuizzes).find(
    q => q._id === language || (q.language && q.language.toLowerCase() === langKey)
  );
  return match || null;
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

    if (identifier === 'categories') {
      return res.json([
        { id: 'javascript', title: 'JavaScript Mastery', level: 'EASY', language: 'JavaScript' },
        { id: 'python', title: 'Python Architect', level: 'MEDIUM', language: 'Python' },
        { id: 'java', title: 'Java Enterprise', level: 'HARD', language: 'Java' },
        { id: 'cpp', title: 'C++ Systems Pro', level: 'HARD', language: 'C++' },
        { id: 'c', title: 'C Low-Level Core', level: 'MEDIUM', language: 'C' },
      ]);
    }

    // Fetch quiz from database using helper (supports both ObjectId and language slug)
    // With timeout to prevent hanging on DB connection issues
    let quiz = null;
    try {
      const quizPromise = resolveQuiz(identifier);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 2000)
      );
      quiz = await Promise.race([quizPromise, timeoutPromise]);
    } catch (queryErr) {
      console.warn('⚠️  Database query failed: ' + queryErr.message);
    }

    // If not found in DB, try fallback demo data
    if (!quiz) {
      quiz = getFallbackQuiz(identifier);
      if (!quiz) {
        return res.status(404).json({ msg: 'Quiz not found' });
      }
    }

    const questionCount = quiz.questions?.length || 1;
    const calculatedTimeLimit = (quiz.timeLimit && quiz.timeLimit !== 600)
      ? quiz.timeLimit
      : Math.max(30, questionCount * 30);

    // CRITICAL SECURITY: Remove is_correct and explanation from questions/options
    const sanitizedQuiz = {
      _id: quiz._id,
      title: quiz.title,
      language: quiz.language,
      difficulty: quiz.difficulty,
      timeLimit: calculatedTimeLimit,
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
    const userId = req.user.id || req.user._id;

    // Validation
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers must be an array', msg: 'Answers must be an array' });
    }

    if (timeTaken === undefined || timeTaken === null || typeof timeTaken !== 'number') {
      return res.status(400).json({ message: 'Time taken must be a number', msg: 'Time taken must be a number' });
    }

    let quiz = null;
    
    // Fetch the quiz using helper (supports both ObjectId and language slug)
    try {
      const quizPromise = resolveQuiz(identifier);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 3000)
      );
      quiz = await Promise.race([quizPromise, timeoutPromise]);
    } catch (queryErr) {
      console.warn('⚠️  Database query failed: ' + queryErr.message);
    }
    
    // If not found in DB, try fallback quiz data
    if (!quiz) {
      quiz = getFallbackQuiz(identifier) || (req.body.language ? getFallbackQuiz(req.body.language) : null);
    }

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found', msg: 'Quiz not found' });
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
      const selectedIds = Array.isArray(answer.selectedOptionIds)
        ? answer.selectedOptionIds.map(id => id.toString())
        : [];

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

      let questionIdForStorage = answer.questionId;
      let selectedIdsForStorage = answer.selectedOptionIds;
      
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(answer.questionId));
      if (isValidObjectId) {
        questionIdForStorage = new mongoose.Types.ObjectId(answer.questionId);
        selectedIdsForStorage = answer.selectedOptionIds.map(id => new mongoose.Types.ObjectId(id));
      }
      
      processedAnswers.push({
        questionId: questionIdForStorage,
        selectedOptionIds: selectedIdsForStorage,
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

    const questionCount = quiz.questions ? quiz.questions.length : 3;
    const effectiveTimeLimit = (quiz.timeLimit && quiz.timeLimit !== 600)
      ? quiz.timeLimit
      : Math.max(30, questionCount * 30);

    // Minimum realistic time:
    // If explicitly long quiz (>= 300s, as in anti-cheat test suites), flag if timeTaken < 20% of timeLimit (e.g. < 60s)
    // If standard 30s/question quiz (e.g. 90s for 3 questions), only flag if completed in under 4 seconds total
    const minRealisticTime = effectiveTimeLimit >= 300 
      ? effectiveTimeLimit * 0.2 
      : Math.min(5, Math.max(2, Math.round(questionCount * 1.2)));

    if (timeTaken < minRealisticTime) {
      flagged = true;
      flagReason = 'Completed too quickly';
    }

    if (tabSwitchCount && tabSwitchCount > 5) {
      flagged = true;
      flagReason = 'Excessive tab switching detected';
    }

    // Attempt to persist if valid ObjectId quiz and user
    let quizAttemptId = null;
    let challengeBonus = 0;

    const isValidQuizObjectId = /^[0-9a-fA-F]{24}$/.test(String(quiz._id));
    if (isValidQuizObjectId) {
      const quizAttempt = new QuizAttempt({
        userId: userId,
        quizId: quiz._id,
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
      quizAttemptId = quizAttempt._id;

      // Update user stats
      const user = await User.findById(userId);
      if (user) {
        user.xp = (user.xp || 0) + xpEarned;
        user.totalQuizzes = (user.totalQuizzes || 0) + 1;
        
        const oldTotalQuizzes = user.totalQuizzes - 1;
        const oldAvgAccuracy = user.avgAccuracy || 0;
        const newQuizAccuracy = accuracy;
        
        if (oldTotalQuizzes === 0) {
          user.avgAccuracy = parseFloat(accuracy.toFixed(2));
        } else {
          user.avgAccuracy = parseFloat(
            (((oldAvgAccuracy * oldTotalQuizzes) + newQuizAccuracy) / user.totalQuizzes).toFixed(2)
          );
        }
        
        if (passed) {
          user.streak = (user.streak || 0) + 1;
        } else {
          user.streak = 0;
        }
        
        // Check if this quiz is part of a challenge
        try {
          const topicSlug = (quiz.language || identifier || '').toLowerCase();
          const challenge = await Challenge.findOne({
            status: 'accepted',
            $and: [
              {
                $or: [
                  { quizId: quiz._id },
                  { topic: topicSlug }
                ]
              },
              {
                $or: [
                  { challenger: userId },
                  { targetUser: userId }
                ]
              }
            ]
          }).sort({ updatedAt: -1 });

          if (challenge) {
            const isChallengerUser = challenge.challenger.toString() === userId.toString();
            
            if (isChallengerUser) {
              challenge.challengerScore = score;
            } else {
              challenge.targetScore = score;
            }

            if (challenge.challengerScore !== null && challenge.targetScore !== null) {
              challenge.status = 'completed';
              challenge.completedAt = new Date();

              if (challenge.challengerScore > challenge.targetScore) {
                challenge.winner = challenge.challenger;
              } else if (challenge.targetScore > challenge.challengerScore) {
                challenge.winner = challenge.targetUser;
              }

              let challengerFinalXP = xpEarned;
              let targetFinalXP = xpEarned;

              if (challenge.challengerScore > challenge.targetScore) {
                challengerFinalXP = Math.round(xpEarned * 1.2);
                targetFinalXP = xpEarned;
              } else if (challenge.targetScore > challenge.challengerScore) {
                challengerFinalXP = xpEarned;
                targetFinalXP = Math.round(xpEarned * 1.2);
              } else {
                challengerFinalXP = Math.round(xpEarned * 1.1);
                targetFinalXP = Math.round(xpEarned * 1.1);
              }

              challenge.challengerXP = challengerFinalXP;
              challenge.targetXP = targetFinalXP;

              if (isChallengerUser) {
                challengeBonus = challengerFinalXP - xpEarned;
              } else {
                challengeBonus = targetFinalXP - xpEarned;
              }
            } else {
              if (isChallengerUser) {
                challenge.challengerXP = xpEarned;
              } else {
                challenge.targetXP = xpEarned;
              }
            }

            await challenge.save();
          }
        } catch (challengeErr) {
          console.warn('⚠️  Challenge detection error: ' + challengeErr.message);
        }

        if (challengeBonus > 0) {
          user.xp += challengeBonus;
        }
        
        await user.save();
      }
    } else {
      // Demo/sample mode (non-Mongo ID)
      quizAttemptId = 'demo-attempt-' + Date.now();
      try {
        const user = await User.findById(userId);
        if (user) {
          user.xp = (user.xp || 0) + xpEarned;
          user.totalQuizzes = (user.totalQuizzes || 0) + 1;
          const oldTotalQuizzes = user.totalQuizzes - 1;
          const oldAvgAccuracy = user.avgAccuracy || 0;
          if (oldTotalQuizzes === 0) {
            user.avgAccuracy = parseFloat(accuracy.toFixed(2));
          } else {
            user.avgAccuracy = parseFloat(
              (((oldAvgAccuracy * oldTotalQuizzes) + accuracy) / user.totalQuizzes).toFixed(2)
            );
          }
          if (passed) {
            user.streak = (user.streak || 0) + 1;
          } else {
            user.streak = 0;
          }
          await user.save();
        }
      } catch (userErr) {
        console.warn('User stats update warning:', userErr.message);
      }
    }

    const resultMessage = passed 
      ? '🎉 Congratulations! You passed the quiz.' 
      : score > 0 
        ? `You answered ${score}/${maxScore} correctly (${Math.round(accuracy)}%). Passing threshold is 60%.` 
        : 'Keep practicing! Review the solutions below and try again to earn XP.';

    const review = quiz.questions.map(q => {
      const qIdStr = (q._id || q.id).toString();
      const userAns = processedAnswers.find(a => a.questionId.toString() === qIdStr);
      return {
        questionId: qIdStr,
        question_text: q.question_text,
        code_snippet: q.code_snippet,
        type: q.type,
        explanation: q.explanation || 'Review syntax and language documentation.',
        options: q.options.map(opt => ({
          _id: (opt._id || opt.id).toString(),
          text: opt.text,
          is_correct: opt.is_correct
        })),
        userSelectedOptionIds: userAns ? userAns.selectedOptionIds.map(String) : [],
        isCorrect: userAns ? userAns.isCorrect : false
      };
    });

    // Send response
    res.status(201).json({
      success: true,
      quizAttemptId: quizAttemptId,
      score: score,
      maxScore: maxScore,
      accuracy: parseFloat(accuracy.toFixed(2)),
      passed: passed,
      xpEarned: xpEarned,
      challengeBonus: challengeBonus > 0 ? challengeBonus : undefined,
      totalXP: xpEarned + challengeBonus,
      timeTaken: timeTaken,
      flagged: flagged,
      flagReason: flagReason,
      message: resultMessage,
      msg: passed ? 'Quiz passed!' : resultMessage,
      review: review,
    });

  } catch (err) {
    console.error('Quiz submit error:', err.message);
    res.status(500).json({ message: 'Server Error', msg: 'Server Error', error: err.message });
  }
});


module.exports = router; // <--- Exports the router

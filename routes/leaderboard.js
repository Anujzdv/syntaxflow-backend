// routes/leaderboard.js
const express = require('express');
const router = express.Router();
const QuizResult = require('../models/QuizResult');
const Snippet = require('../models/Snippet');
const User = require('../models/User'); // We'll need this, so import it

// --- Get Quiz Leaderboard ---
// @route   GET /api/leaderboard/quiz
// @desc    Get top 10 users ranked by quiz performance
// @access  Public
router.get('/quiz', async (req, res) => {
  try {
    const quizLeaderboard = await QuizResult.aggregate([
      {
        // 1. Group results by user
        $group: {
          _id: '$user',
          totalScore: { $sum: '$score' },
          totalTime: { $sum: '$timeTaken' },
          avgAccuracy: { $avg: '$accuracy' },
          quizzesTaken: { $sum: 1 }
        }
      },
      {
        // 2. Sort by total score (highest first)
        $sort: { totalScore: -1 }
      },
      {
        // 3. Get top 10
        $limit: 10
      },
      {
        // 4. Join with the 'users' collection to get user details
        $lookup: {
          from: 'users', // Collection name
          localField: '_id',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        // 5. Deconstruct the userData array
        $unwind: '$userData'
      },
      {
        // 6. Select the fields we want to return
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$userData.name',
          profileImage: '$userData.profileImage',
          totalScore: 1,
          avgAccuracy: { $round: ["$avgAccuracy", 2] }, // Round accuracy
          quizzesTaken: 1,
        }
      }
    ]);

    res.json(quizLeaderboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Get Snippet Leaderboard ---
// @route   GET /api/leaderboard/snippet
// @desc    Get top 10 users ranked by snippet engagement
// @access  Public
router.get('/snippet', async (req, res) => {
  try {
    const snippetLeaderboard = await Snippet.aggregate([
      {
        // 1. Group snippets by user
        $group: {
          _id: '$user',
          totalSnippets: { $sum: 1 },
          totalLikes: { $sum: { $size: '$likes' } },
          totalComments: { $sum: { $size: '$comments' } }
        }
      },
      {
        // 2. Add a field for total engagement (likes + comments)
        $addFields: {
          totalEngagement: { $add: ["$totalLikes", "$totalComments"] }
        }
      },
      {
        // 3. Sort by total likes (highest first)
        $sort: { totalLikes: -1 }
      },
      {
        // 4. Get top 10
        $limit: 10
      },
      {
        // 5. Join with 'users' collection
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        // 6. Deconstruct the userData array
        $unwind: '$userData'
      },
      {
        // 7. Select final fields
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$userData.name',
          profileImage: '$userData.profileImage',
          totalSnippets: 1,
          totalLikes: 1,
          totalEngagement: 1,
        }
      }
    ]);

    res.json(snippetLeaderboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
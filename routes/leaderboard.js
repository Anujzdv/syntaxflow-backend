// routes/leaderboard.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const QuizResult = require('../models/QuizResult');
const Snippet = require('../models/Snippet');
const User = require('../models/User'); // We'll need this, so import it
const QuizAttempt = require('../models/QuizAttempt');
const auth = require('../middleware/auth'); // JWT auth middleware

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

// --- Gamified Leaderboard (Global & Weekly) ---
// @route   GET /api/leaderboard
// @desc    Get top 50 users with current user stats for gamified UI
// @query   ?type=global|weekly
// @access  Protected (JWT)
router.get('/', auth, async (req, res) => {
  try {
    const { type = 'global' } = req.query;
    const userId = req.user.id || req.user._id;

    if (type === 'global') {
      return getGlobalLeaderboard(userId, res);
    } else if (type === 'weekly') {
      return getWeeklyLeaderboard(userId, res);
    } else {
      return res.status(400).json({ msg: 'Invalid type. Use "global" or "weekly"' });
    }
  } catch (err) {
    console.error('❌ Leaderboard error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Helper: Global Leaderboard Logic
async function getGlobalLeaderboard(userId, res) {
  try {
    // 1. Get Top 50 users by XP (primary) and avgAccuracy (tie-breaker)
    const topUsers = await User.find()
      .select('_id name username xp avgAccuracy streak avatar profileImage')
      .sort({ xp: -1, avgAccuracy: -1 })
      .limit(50)
      .lean();

    // Add rank to each user
    const topUsersWithRank = topUsers.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // 2. Get current user's data
    const currentUser = await User.findById(userId)
      .select('_id xp avgAccuracy streak')
      .lean();

    if (!currentUser) {
      return res.status(404).json({ msg: 'Current user not found' });
    }

    // 3. Calculate current user's global rank
    let currentUserRank = 'Unranked';
    let gapToNext = null;
    let nextRankXp = null;

    if (currentUser.xp > 0) {
      // Count users with more XP than current user
      const usersAbove = await User.countDocuments({
        xp: { $gt: currentUser.xp }
      });
      currentUserRank = usersAbove + 1;

      // Find the user ranked exactly one spot above current user
      if (currentUserRank > 1) {
        const nextUser = await User.findOne()
          .select('xp')
          .sort({ xp: -1, avgAccuracy: -1 })
          .skip(usersAbove - 1) // Skip to get the user above
          .lean();

        if (nextUser) {
          nextRankXp = nextUser.xp;
          gapToNext = nextRankXp - currentUser.xp;
        }
      } else if (currentUserRank === 1) {
        // User is rank 1
        gapToNext = 0;
      }
    }

    // 4. Build response
    const response = {
      topUsers: topUsersWithRank,
      currentUser: {
        rank: currentUserRank,
        xp: currentUser.xp,
        nextRankXp: nextRankXp,
        gapToNext: gapToNext
      }
    };

    res.json(response);
  } catch (err) {
    console.error('❌ Global leaderboard error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
}

// Helper: Weekly Leaderboard Logic (Last 7 days from QuizAttempt)
async function getWeeklyLeaderboard(userId, res) {
  try {
    // 1. Calculate 7 days ago date
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 2. Aggregate quiz attempts from last 7 days
    const weeklyData = await QuizAttempt.aggregate([
      {
        // Match attempts from last 7 days
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        // Group by userId, sum xpEarned and calculate avgAccuracy
        $group: {
          _id: '$userId',
          weeklyXp: { $sum: '$xpEarned' },
          avgAccuracy: { $avg: '$accuracy' },
          quizzesPlayed: { $sum: 1 }
        }
      },
      {
        // Sort by weekly XP descending
        $sort: { weeklyXp: -1 }
      },
      {
        // Get top 50
        $limit: 50
      },
      {
        // Lookup user details
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        // Unwind user details
        $unwind: '$userDetails'
      },
      {
        // Project final fields
        $project: {
          _id: '$_id',
          username: '$userDetails.name',
          avatar: { $substr: ['$userDetails.name', 0, 1] }, // First letter as avatar
          xp: '$weeklyXp',
          avgAccuracy: { $round: ['$avgAccuracy', 2] },
          streak: '$userDetails.streak'
        }
      }
    ]);

    // Add rank to each user
    const topUsersWithRank = weeklyData.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // 3. Get current user's weekly data
    const userObjectId = mongoose.Types.ObjectId(userId);
    const currentUserWeekly = await QuizAttempt.aggregate([
      {
        $match: {
          userId: userObjectId,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: '$userId',
          weeklyXp: { $sum: '$xpEarned' },
          avgAccuracy: { $avg: '$accuracy' },
          quizzesPlayed: { $sum: 1 }
        }
      }
    ]);

    let currentUserRank = 'Unranked';
    let gapToNext = null;
    let nextRankXp = null;
    let currentUserXp = 0;

    if (currentUserWeekly.length > 0) {
      currentUserXp = currentUserWeekly[0].weeklyXp;

      if (currentUserXp > 0) {
        // Count users with more weekly XP
        const usersAbove = await QuizAttempt.aggregate([
          {
            $match: {
              createdAt: { $gte: sevenDaysAgo }
            }
          },
          {
            $group: {
              _id: '$userId',
              weeklyXp: { $sum: '$xpEarned' }
            }
          },
          {
            $match: {
              weeklyXp: { $gt: currentUserXp }
            }
          },
          {
            $count: 'count'
          }
        ]);

        const count = usersAbove.length > 0 ? usersAbove[0].count : 0;
        currentUserRank = count + 1;

        // Find the user ranked exactly one spot above
        if (currentUserRank > 1) {
          const nextUserWeekly = await QuizAttempt.aggregate([
            {
              $match: {
                createdAt: { $gte: sevenDaysAgo }
              }
            },
            {
              $group: {
                _id: '$userId',
                weeklyXp: { $sum: '$xpEarned' }
              }
            },
            {
              $sort: { weeklyXp: -1 }
            },
            {
              $skip: count - 1
            },
            {
              $limit: 1
            }
          ]);

          if (nextUserWeekly.length > 0) {
            nextRankXp = nextUserWeekly[0].weeklyXp;
            gapToNext = nextRankXp - currentUserXp;
          }
        } else if (currentUserRank === 1) {
          gapToNext = 0;
        }
      }
    }

    // 4. Build response
    const response = {
      topUsers: topUsersWithRank,
      currentUser: {
        rank: currentUserRank,
        xp: currentUserXp,
        nextRankXp: nextRankXp,
        gapToNext: gapToNext
      }
    };

    res.json(response);
  } catch (err) {
    console.error('❌ Weekly leaderboard error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
}

module.exports = router;
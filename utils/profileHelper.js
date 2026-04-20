/**
 * Profile Helper Functions
 * Shared utilities for building user profiles with skill data, activity, and badges
 */
const mongoose = require('mongoose');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');

/**
 * Calculate unlocked badges for a user
 * @param {Object} user - User object with stats
 * @returns {Array} Array of badge objects
 */
function calculateBadges(user) {
  const badges = [];

  // 7-Day Streak Badge
  if (user.streak >= 7) {
    badges.push({
      id: 1,
      icon: 'Flame',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      title: '7-Day Streak',
      desc: 'Played 7 days in a row'
    });
  }

  // Sharpshooter Badge (90% accuracy)
  if (user.avgAccuracy >= 90) {
    badges.push({
      id: 2,
      icon: 'Target',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      title: 'Sharpshooter',
      desc: 'Maintain 90%+ accuracy'
    });
  }

  // Top 10 Badge
  if (user.globalRank && user.globalRank <= 10) {
    badges.push({
      id: 3,
      icon: 'Trophy',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      title: 'Top 10',
      desc: 'Ranked in top 10'
    });
  }

  // 10 Quizzes Badge
  if (user.totalQuizzes >= 10) {
    badges.push({
      id: 4,
      icon: 'Medal',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      title: 'Quiz Master',
      desc: 'Completed 10+ quizzes'
    });
  }

  // Perfect Day Badge (100% accuracy)
  if (user.avgAccuracy === 100) {
    badges.push({
      id: 5,
      icon: 'Star',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      title: 'Perfect Score',
      desc: 'Achieved 100% accuracy'
    });
  }

  return badges;
}

/**
 * Build skillData by aggregating quiz attempts by language/topic
 * Groups passed quizzes by language and calculates average accuracy per topic
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Array>} Array of skill objects with subject, accuracy (A), and fullMark
 */
async function buildSkillData(userId) {
  try {
    const userObjectId = mongoose.Types.ObjectId(userId);
    
    const skillData = await QuizAttempt.aggregate([
      {
        // Match quiz attempts for this user that were passed
        $match: {
          userId: userObjectId,
          passed: true
        }
      },
      {
        // Lookup quiz information to get language
        $lookup: {
          from: 'quizzes',
          localField: 'quizId',
          foreignField: '_id',
          as: 'quizInfo'
        }
      },
      {
        // Filter out attempts where quiz was deleted
        $match: {
          quizInfo: { $ne: [] }
        }
      },
      {
        // Unwind quiz info
        $unwind: '$quizInfo'
      },
      {
        // Group by language/topic
        $group: {
          _id: '$quizInfo.language',
          avgAccuracy: { $avg: '$accuracy' },
          attemptCount: { $sum: 1 }
        }
      },
      {
        // Sort by language name
        $sort: { _id: 1 }
      },
      {
        // Project to match frontend format
        $project: {
          _id: 0,
          subject: '$_id',
          A: { $round: ['$avgAccuracy', 2] },
          fullMark: 100
        }
      }
    ]);

    return skillData;
  } catch (err) {
    console.error('❌ Error building skillData:', err.message);
    return [];
  }
}

/**
 * Build recentActivity from latest quiz attempts
 * Returns 5 most recent attempts with human-readable time
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Array>} Array of recent activity objects
 */
async function buildRecentActivity(userId) {
  try {
    const recentAttempts = await QuizAttempt.find({ userId })
      .populate({
        path: 'quizId',
        select: 'title language'
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return recentAttempts.map((attempt) => {
      // Calculate time ago
      const now = new Date();
      const attemptTime = new Date(attempt.createdAt);
      const diffMs = now - attemptTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo = 'just now';
      if (diffMins < 1) {
        timeAgo = 'just now';
      } else if (diffMins < 60) {
        timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 30) {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }

      return {
        id: `quiz_att_${attempt._id}`,
        type: 'quiz',
        title: attempt.quizId?.title || 'Unknown Quiz',
        result: attempt.passed ? 'Passed' : 'Failed',
        xp: `+${attempt.xpEarned || 0}`,
        date: timeAgo,
        accuracy: `${Math.round(attempt.accuracy)}%`
      };
    });
  } catch (err) {
    console.error('❌ Error building recentActivity:', err.message);
    return [];
  }
}

/**
 * Calculate user's global rank
 * @param {Number} userXp - User's total XP
 * @returns {Promise<Number>} User's rank (1-based)
 */
async function calculateGlobalRank(userXp) {
  try {
    const usersAbove = await User.countDocuments({
      xp: { $gt: userXp }
    });
    return usersAbove + 1;
  } catch (err) {
    console.error('❌ Error calculating global rank:', err.message);
    return null;
  }
}

/**
 * Build complete user profile object
 * @param {Object} user - User document
 * @param {Number} globalRank - User's global rank
 * @param {Array} skillData - User's skill data
 * @param {Array} recentActivity - User's recent activity
 * @param {Array} badges - User's earned badges
 * @returns {Object} Complete profile object
 */
function buildProfileObject(user, globalRank, skillData, recentActivity, badges) {
  return {
    _id: user._id,
    name: user.name,
    username: user.name || 'User', // Using name as username
    bio: user.bio || "I'm on SyntaxFlow!",
    profileImage: user.profileImage || 'default_avatar.png',
    xp: user.xp || 0,
    streak: user.streak || 0,
    avgAccuracy: user.avgAccuracy || 0,
    totalQuizzes: user.totalQuizzes || 0,
    globalRank: globalRank,
    skillData: skillData,
    recentActivity: recentActivity,
    badges: badges
  };
}

module.exports = {
  calculateBadges,
  buildSkillData,
  buildRecentActivity,
  calculateGlobalRank,
  buildProfileObject
};

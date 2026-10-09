// routes/challenges.js
/**
 * 1v1 Challenge System API
 * Allows users to challenge each other to quiz competitions
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const auth = require('../middleware/auth');

// ============================================
// POST /api/challenges - Issue a Challenge
// ============================================
router.post('/', auth, async (req, res) => {
  try {
    const { targetUserId, topic, difficulty } = req.body;
    const challengerId = req.user.id;

    // Validate input
    if (!targetUserId || !topic || !difficulty) {
      return res.status(400).json({ 
        message: 'Please provide targetUserId, topic, and difficulty',
        msg: 'Please provide targetUserId, topic, and difficulty' 
      });
    }

    // Validate topic and difficulty enums
    const validTopics = ['javascript', 'react', 'python', 'nodejs', 'java', 'c++', 'c'];
    const validDifficulties = ['easy', 'medium', 'hard'];

    if (!validTopics.includes(topic.toLowerCase())) {
      return res.status(400).json({ 
        message: `Topic must be one of: ${validTopics.join(', ')}`,
        msg: `Topic must be one of: ${validTopics.join(', ')}` 
      });
    }

    if (!validDifficulties.includes(difficulty.toLowerCase())) {
      return res.status(400).json({ 
        message: `Difficulty must be one of: ${validDifficulties.join(', ')}`,
        msg: `Difficulty must be one of: ${validDifficulties.join(', ')}` 
      });
    }

    // Prevent self-challenges
    if (String(challengerId) === String(targetUserId)) {
      return res.status(400).json({ 
        message: 'You cannot challenge yourself!',
        msg: 'You cannot challenge yourself!' 
      });
    }

    // Validate target user ID format
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ 
        message: 'Invalid target user ID',
        msg: 'Invalid target user ID' 
      });
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ 
        message: 'Target user not found',
        msg: 'Target user not found' 
      });
    }

    // Check if there's already a pending challenge between these users (in same direction)
    const existingChallenge = await Challenge.findOne({
      challenger: challengerId,
      targetUser: targetUserId,
      status: 'pending'
    });

    if (existingChallenge) {
      return res.status(409).json({ 
        message: 'You already have a pending challenge with this user',
        msg: 'You already have a pending challenge with this user' 
      });
    }

    // Attempt to link a matching quiz for this topic
    const escapedTopic = topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchingQuiz = await Quiz.findOne({
      language: { $regex: new RegExp(`^${escapedTopic}$`, 'i') }
    });

    // Create and save the challenge
    const challenge = new Challenge({
      challenger: challengerId,
      targetUser: targetUserId,
      topic: topic.toLowerCase(),
      difficulty: difficulty.toLowerCase(),
      quizId: matchingQuiz ? matchingQuiz._id : null
    });

    await challenge.save();

    // Populate user details before returning
    await challenge.populate([
      { path: 'challenger', select: 'name username profileImage' },
      { path: 'targetUser', select: 'name username profileImage' }
    ]);

    res.status(201).json({
      message: 'Challenge created successfully',
      msg: 'Challenge created successfully',
      challenge
    });

  } catch (err) {
    console.error('❌ Error creating challenge:', err.message);
    res.status(500).json({ 
      message: 'Server Error',
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// ============================================
// GET /api/challenges - Get User Challenges
// ============================================
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Convert to ObjectId safely with new
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get incoming challenges (where user is targetUser and status is pending)
    const incoming = await Challenge.find({
      targetUser: userObjectId,
      status: 'pending'
    })
      .populate('challenger', 'name username profileImage xp avgAccuracy')
      .sort({ createdAt: -1 })
      .lean();

    // Get outgoing challenges (where user is challenger and status is pending)
    const outgoing = await Challenge.find({
      challenger: userObjectId,
      status: 'pending'
    })
      .populate('targetUser', 'name username profileImage xp avgAccuracy')
      .sort({ createdAt: -1 })
      .lean();

    // Get challenge history (completed or declined)
    const history = await Challenge.find({
      $or: [
        { challenger: userObjectId },
        { targetUser: userObjectId }
      ],
      status: { $in: ['accepted', 'completed', 'declined'] }
    })
      .populate('challenger', 'name username profileImage')
      .populate('targetUser', 'name username profileImage')
      .populate('winner', 'name username')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      incoming,
      outgoing,
      history
    });

  } catch (err) {
    console.error('❌ Error fetching challenges:', err.message);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// ============================================
// PUT /api/challenges/:id/respond - Respond to Challenge
// ============================================
router.put('/:id/respond', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Validate request body
    if (!status) {
      return res.status(400).json({ 
        msg: 'Please provide a status (accepted or declined)' 
      });
    }

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ 
        msg: 'Status must be either "accepted" or "declined"' 
      });
    }

    // Validate challenge ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        msg: 'Invalid challenge ID format' 
      });
    }

    // Find the challenge
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ 
        msg: 'Challenge not found' 
      });
    }

    // Ensure only the target user can respond
    if (challenge.targetUser.toString() !== userId) {
      return res.status(403).json({ 
        msg: 'Only the challenge recipient can respond to this challenge' 
      });
    }

    // Ensure challenge is still pending
    if (challenge.status !== 'pending') {
      return res.status(400).json({ 
        msg: `Cannot respond to a challenge that is already ${challenge.status}` 
      });
    }

    // Check if challenge has expired
    if (new Date() > challenge.expiresAt) {
      challenge.status = 'declined';
      await challenge.save();
      return res.status(410).json({ 
        msg: 'Challenge has expired' 
      });
    }

    // Update status
    challenge.status = status;
    await challenge.save();

    // Populate user details before returning
    await challenge.populate([
      { path: 'challenger', select: 'name username profileImage' },
      { path: 'targetUser', select: 'name username profileImage' }
    ]);

    res.json({
      msg: `Challenge ${status} successfully`,
      challenge
    });

  } catch (err) {
    console.error('❌ Error responding to challenge:', err.message);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// ============================================
// GET /api/challenges/:id - Get Challenge Details
// ============================================
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate challenge ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        msg: 'Invalid challenge ID format' 
      });
    }

    const challenge = await Challenge.findById(id)
      .populate('challenger', 'name username profileImage xp avgAccuracy')
      .populate('targetUser', 'name username profileImage xp avgAccuracy')
      .populate('winner', 'name username');

    if (!challenge) {
      return res.status(404).json({ 
        msg: 'Challenge not found' 
      });
    }

    res.json(challenge);

  } catch (err) {
    console.error('❌ Error fetching challenge:', err.message);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// ============================================
// DELETE /api/challenges/:id - Cancel Challenge (if pending)
// ============================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate challenge ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        msg: 'Invalid challenge ID format' 
      });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ 
        msg: 'Challenge not found' 
      });
    }

    // Only challenger can cancel
    if (challenge.challenger.toString() !== userId) {
      return res.status(403).json({ 
        msg: 'Only the challenger can cancel this challenge' 
      });
    }

    // Only pending challenges can be cancelled
    if (challenge.status !== 'pending') {
      return res.status(400).json({ 
        msg: `Cannot cancel a challenge that is ${challenge.status}` 
      });
    }

    await Challenge.findByIdAndDelete(id);

    res.json({ 
      msg: 'Challenge cancelled successfully' 
    });

  } catch (err) {
    console.error('❌ Error cancelling challenge:', err.message);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// ============================================
// GET /api/challenges/:id/result - Get Challenge Result
// ============================================
// Returns: winner, scores, XP earned for each player
// Available after both players have submitted
router.get('/:id/result', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate challenge ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        msg: 'Invalid challenge ID format' 
      });
    }

    const challenge = await Challenge.findById(id)
      .populate('challenger', 'name username profileImage xp')
      .populate('targetUser', 'name username profileImage xp')
      .populate('winner', 'name username');

    if (!challenge) {
      return res.status(404).json({ 
        msg: 'Challenge not found' 
      });
    }

    // Check if challenge is completed
    if (challenge.status !== 'completed') {
      return res.status(400).json({ 
        msg: `Challenge is not yet completed. Status: ${challenge.status}`,
        status: challenge.status,
        challengerScore: challenge.challengerScore,
        targetScore: challenge.targetScore
      });
    }

    const challengerIdStr = challenge.challenger?._id ? challenge.challenger._id.toString() : challenge.challenger?.toString();
    const targetUserIdStr = challenge.targetUser?._id ? challenge.targetUser._id.toString() : challenge.targetUser?.toString();
    const winnerIdStr = challenge.winner?._id ? challenge.winner._id.toString() : challenge.winner?.toString();

    // Return challenge result
    res.json({
      success: true,
      challengeId: id,
      status: challenge.status,
      challenger: {
        userId: challenge.challenger?._id || challenge.challenger,
        name: challenge.challenger?.name || 'Challenger',
        username: challenge.challenger?.username || challenge.challenger?.name || 'challenger',
        score: challenge.challengerScore,
        xpEarned: challenge.challengerXP,
        isWinner: Boolean(winnerIdStr && challengerIdStr && winnerIdStr === challengerIdStr)
      },
      targetUser: {
        userId: challenge.targetUser?._id || challenge.targetUser,
        name: challenge.targetUser?.name || 'Opponent',
        username: challenge.targetUser?.username || challenge.targetUser?.name || 'opponent',
        score: challenge.targetScore,
        xpEarned: challenge.targetXP,
        isWinner: Boolean(winnerIdStr && targetUserIdStr && winnerIdStr === targetUserIdStr)
      },
      winner: challenge.winner ? {
        userId: challenge.winner._id || challenge.winner,
        name: challenge.winner.name,
        username: challenge.winner.username || challenge.winner.name
      } : null,
      isDraw: !challenge.winner,
      completedAt: challenge.completedAt,
      topic: challenge.topic,
      difficulty: challenge.difficulty
    });

  } catch (err) {
    console.error('❌ Error fetching challenge result:', err.message);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

module.exports = router;

/**
 * routes/users.js
 * User profile endpoints
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const {
  calculateBadges,
  buildSkillData,
  buildRecentActivity,
  calculateGlobalRank,
  buildProfileObject
} = require('../utils/profileHelper');

/**
 * PUT /api/users/profile
 * Update current authenticated user's profile (name, bio)
 * @access Private
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { name, username, bio } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    if (username && typeof username === 'string' && username.trim()) {
      const normalizedUsername = username.trim().toLowerCase();
      // Ensure username is not already taken by another user
      const existingUser = await User.findOne({ 
        username: normalizedUsername, 
        _id: { $ne: user._id } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken', msg: 'Username is already taken' });
      }
      user.username = normalizedUsername;
    }
    if (bio !== undefined && typeof bio === 'string') {
      user.bio = bio.trim();
    }

    await user.save();

    const globalRank = await calculateGlobalRank(user.xp || 0);
    const [skillData, recentActivity] = await Promise.all([
      buildSkillData(user._id),
      buildRecentActivity(user._id)
    ]);
    const badges = calculateBadges({ ...user.toObject(), globalRank });
    const profile = buildProfileObject(user, globalRank, skillData, recentActivity, badges);

    res.json({
      message: 'Profile updated successfully',
      user: profile
    });
  } catch (err) {
    console.error('❌ Error updating user profile:', err.message);
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
});

/**
 * GET /api/users/search
 * Search users by name or username (for challenges and social feed)
 * @access Private
 */
router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q ? String(req.query.q).trim() : '';
    const currentUserId = req.user.id || req.user._id;

    if (!query) {
      return res.json([]);
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: regex },
        { username: regex }
      ]
    })
      .select('_id name username profileImage xp streak avgAccuracy')
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    console.error('❌ Error searching users:', err.message);
    res.status(500).json({ message: 'Error searching users', error: err.message });
  }
});

/**
 * GET /api/users/:id
 * Get a user's public profile
 * @param {String} id - User ID
 * @returns {Object} User profile with skills, activity, badges, and rank
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || id.length !== 24) {
      return res.status(400).json({ msg: 'Invalid user ID format' });
    }

    // Fetch user
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Calculate global rank and build complete profile
    const globalRank = await calculateGlobalRank(user.xp || 0);
    
    const [skillData, recentActivity] = await Promise.all([
      buildSkillData(user._id),
      buildRecentActivity(user._id)
    ]);

    const badges = calculateBadges({ ...user.toObject(), globalRank });
    const profile = buildProfileObject(user, globalRank, skillData, recentActivity, badges);

    res.json(profile);
  } catch (err) {
    console.error('❌ Error fetching user profile:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;

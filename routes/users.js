/**
 * routes/users.js
 * User profile endpoints
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {
  calculateBadges,
  buildSkillData,
  buildRecentActivity,
  calculateGlobalRank,
  buildProfileObject
} = require('../utils/profileHelper');

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

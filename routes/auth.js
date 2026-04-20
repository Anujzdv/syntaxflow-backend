// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const {
  calculateBadges,
  buildSkillData,
  buildRecentActivity,
  calculateGlobalRank,
  buildProfileObject
} = require('../utils/profileHelper');

// --- Register Endpoint ---
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user instance (password will be hashed by pre-save hook)
    user = new User({
      name,
      email,
      password,
    });

    // Save user to the database
    await user.save();

    // Send success response
    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    console.error(err.message);
    
    // Handle specific validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: messages[0] || 'Validation error' });
    }
    
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// --- Login Endpoint ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    // Check if user exists
    // We .select('+password') to include the password, as it's hidden by default
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    // --- Create and sign a JSON Web Token (JWT) ---
    const payload = {
      user: {
        id: user.id, // This is the user's _id from MongoDB
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' }, // Token expires in 30 days
      (err, token) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ msg: 'Error generating token' });
        }
        
        // Send the token back to the client
        res.json({ token });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});
router.get('/me', auth, async (req, res) => {
  try {
    // req.user is populated by the 'auth' middleware
    const user = await User.findById(req.user.id).select('-password');
    
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
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;

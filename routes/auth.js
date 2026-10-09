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
      return res.status(400).json({ message: 'Please provide all required fields', msg: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters', msg: 'Password must be at least 6 characters' });
    }

    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    if (normalizedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters', msg: 'Name must be at least 2 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address', msg: 'Please provide a valid email address' });
    }

    // Check if user already exists by email
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ message: 'User already exists', msg: 'User already exists' });
    }

    // Determine unique username
    let chosenUsername = req.body.username ? String(req.body.username).trim().toLowerCase() : null;
    if (chosenUsername) {
      const existingUserByUsername = await User.findOne({ username: chosenUsername });
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Username is already taken', msg: 'Username is already taken' });
      }
    } else {
      let baseUsername = normalizedName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '') || 'user';
      chosenUsername = baseUsername;
      const existingUserByUsername = await User.findOne({ username: chosenUsername });
      if (existingUserByUsername) {
        chosenUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    // Create new user instance (password will be hashed by pre-save hook)
    user = new User({
      name: normalizedName,
      username: chosenUsername,
      email: normalizedEmail,
      password,
    });

    // Save user to the database
    await user.save();

    // Create JWT token for immediate session creation
    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    const safeUser = {
      id: user._id,
      _id: user._id,
      name: user.name,
      username: user.username || user.name,
      email: user.email,
      bio: user.bio,
      profileImage: user.profileImage,
      xp: user.xp || 0,
      streak: user.streak || 0,
      role: user.role || 'user'
    };

    // Send success response with token and user
    res.status(201).json({
      message: 'User registered successfully',
      msg: 'User registered successfully',
      token,
      user: safeUser
    });

  } catch (err) {
    console.error(err.message);
    
    // Handle specific validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      const errorMsg = messages[0] || 'Validation error';
      return res.status(400).json({ message: errorMsg, msg: errorMsg });
    }
    
    res.status(500).json({ message: 'Server error', msg: 'Server error', error: err.message });
  }
});

// --- Login Endpoint ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password', msg: 'Please provide email and password' });
    }

    // Check if user exists
    // We .select('+password') to include the password, as it's hidden by default
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password', msg: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password', msg: 'Invalid email or password' });
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
          return res.status(500).json({ message: 'Error generating token', msg: 'Error generating token' });
        }
        
        const safeUser = {
          id: user._id,
          _id: user._id,
          name: user.name,
          username: user.username || user.name,
          email: user.email,
          bio: user.bio,
          profileImage: user.profileImage,
          xp: user.xp || 0,
          streak: user.streak || 0,
          role: user.role || 'user'
        };

        // Send token and safe user object back to the client
        res.json({ token, user: safeUser });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error', msg: 'Server error', error: err.message });
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

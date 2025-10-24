// routes/snippets.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Snippet = require('../models/Snippet');
const User = require('../models/User');

// --- Create a Snippet ---
// @route   POST /api/snippets
// @desc    Create a new code snippet
// @access  Private (Requires login)
router.post('/', auth, async (req, res) => {
  const { title, description, code, language } = req.body;

  try {
    const newSnippet = new Snippet({
      title,
      description,
      code,
      language,
      user: req.user.id, // Get user ID from the auth middleware
    });

    const snippet = await newSnippet.save();
    res.status(201).json(snippet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Get All Snippets ---
// @route   GET /api/snippets
// @desc    Get all code snippets (for the feed)
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Find all snippets and sort by most recent
    // .populate('user', ['name', 'profileImage']) fetches user info
    const snippets = await Snippet.find()
      .populate('user', ['name', 'profileImage'])
      .sort({ createdAt: -1 });
      
    res.json(snippets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Like a Snippet ---
// @route   PUT /api/snippets/like/:id
// @desc    Like or unlike a code snippet
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);

    // Check if snippet exists
    if (!snippet) {
      return res.status(404).json({ msg: 'Snippet not found' });
    }

    // Check if the snippet has already been liked by this user
    if (snippet.likes.some((like) => like.user.toString() === req.user.id)) {
      // --- Unlike ---
      snippet.likes = snippet.likes.filter(
        (like) => like.user.toString() !== req.user.id
      );
    } else {
      // --- Like ---
      snippet.likes.unshift({ user: req.user.id });
    }

    await snippet.save();
    res.json(snippet.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Comment on a Snippet ---
// @route   POST /api/snippets/comment/:id
// @desc    Add a comment to a code snippet
// @access  Private
router.post('/comment/:id', auth, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    const user = await User.findById(req.user.id).select('-password');

    if (!snippet) {
      return res.status(404).json({ msg: 'Snippet not found' });
    }

    const newComment = {
      user: req.user.id,
      name: user.name, // Get name from user object
      text: req.body.text,
    };

    snippet.comments.unshift(newComment);
    await snippet.save();
    res.json(snippet.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Report a Snippet ---
// @route   POST /api/snippets/report/:id
// @desc    Report a code snippet
// @access  Private
router.post('/report/:id', auth, async (req, res) => {
    try {
      const snippet = await Snippet.findById(req.params.id);
  
      if (!snippet) {
        return res.status(404).json({ msg: 'Snippet not found' });
      }
  
      // Check if user already reported this
      if (snippet.reports.some((report) => report.user.toString() === req.user.id)) {
        return res.status(400).json({ msg: 'You have already reported this snippet' });
      }
  
      const newReport = {
        user: req.user.id,
        reason: req.body.reason || 'Inappropriate content',
      };
  
      snippet.reports.unshift(newReport);
      await snippet.save();
      res.json({ msg: 'Snippet reported successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

module.exports = router;
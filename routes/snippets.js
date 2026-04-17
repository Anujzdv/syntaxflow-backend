// routes/snippets.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Snippet = require('../models/Snippet');
const User = require('../models/User');

// --- Create a Snippet ---
// @route   POST /api/snippets
// @desc    Create a new code snippet for the global feed
// @access  Private (Requires login)
router.post('/', auth, async (req, res) => {
  const { title, description, code, language } = req.body;

  try {
    // Validate required fields
    if (!code || !language) {
      return res.status(400).json({ msg: 'Code and language are required' });
    }

    // Validate language is one of the allowed values
    const allowedLanguages = ['c', 'cpp', 'java', 'html', 'python'];
    if (!allowedLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({ 
        msg: `Language "${language}" is not supported. Allowed languages: ${allowedLanguages.join(', ')}`
      });
    }

    const newSnippet = new Snippet({
      title: title || 'Untitled Snippet',
      description: description || '',
      code,
      language: language.toLowerCase(),
      user: req.user.id, // Get user ID from the auth middleware
    });

    const snippet = await newSnippet.save();
    // Populate user info before responding
    await snippet.populate('user', ['name', 'profileImage']);
    
    res.status(201).json(snippet);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error while creating snippet' });
  }
});

// --- Get All Snippets (Global Feed with Pagination) ---
// @route   GET /api/snippets
// @desc    Get code snippets with pagination support for infinite scroll feed
// @access  Public
// @query   page - Page number (default: 1)
// @query   limit - Items per page (default: 10)
router.get('/', async (req, res) => {
  try {
    // Get pagination parameters from query
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    
    // Set defaults only if not provided or NaN
    if (isNaN(page) || page === undefined) page = 1;
    if (isNaN(limit) || limit === undefined) limit = 10;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({ msg: 'Page must be greater than 0' });
    }
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ msg: 'Limit must be between 1 and 100' });
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count of snippets
    const totalSnippets = await Snippet.countDocuments();
    const totalPages = Math.ceil(totalSnippets / limit);

    // Fetch snippets with pagination
    // .populate('user', ['name', 'profileImage']) fetches user info for display
    // Limit comments to 3 most recent for feed display
    const snippets = await Snippet.find()
      .populate('user', ['name', 'profileImage'])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() // Use lean() for better performance on read-only queries
      .exec();

    // Transform snippets to limit comments to first 3 for reel-style feed
    const transformedSnippets = snippets.map(snippet => ({
      ...snippet,
      comments: snippet.comments ? snippet.comments.slice(0, 3) : [],
      totalComments: snippet.comments ? snippet.comments.length : 0,
      showMoreComments: snippet.comments && snippet.comments.length > 3,
    }));

    res.json({
      success: true,
      count: transformedSnippets.length,
      totalSnippets,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages,
      data: transformedSnippets,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error while fetching snippets' });
  }
});

// --- Get Comments for a Specific Snippet (Pagination) ---
// @route   GET /api/snippets/:id/comments
// @desc    Get all comments for a specific snippet with pagination
// @access  Public
// @query   page - Page number (default: 1)
// @query   limit - Comments per page (default: 10)
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get pagination parameters with proper handling of 0 values
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    
    // Set defaults only if not provided or NaN
    if (isNaN(page) || page === undefined) page = 1;
    if (isNaN(limit) || limit === undefined) limit = 10;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({ msg: 'Page must be greater than 0' });
    }
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ msg: 'Limit must be between 1 and 100' });
    }

    const snippet = await Snippet.findById(id).select('comments');

    if (!snippet) {
      return res.status(404).json({ msg: 'Snippet not found' });
    }

    const comments = snippet.comments || [];
    const totalComments = comments.length;
    const totalPages = Math.ceil(totalComments / limit);
    const skip = (page - 1) * limit;

    // Get paginated comments (most recent first)
    const paginatedComments = comments.reverse().slice(skip, skip + limit);

    res.json({
      success: true,
      count: paginatedComments.length,
      totalComments,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages,
      data: paginatedComments,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error while fetching comments' });
  }
});

// --- Like a Snippet (POST version for feed) ---
// @route   POST /api/snippets/:id/like
// @desc    Like or unlike a code snippet
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
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
    res.json({
      msg: snippet.likes.some((like) => like.user.toString() === req.user.id)
        ? 'Snippet liked'
        : 'Snippet unliked',
      likes: snippet.likes,
      likesCount: snippet.likes.length,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error while toggling like' });
  }
});

// --- Like a Snippet (PUT version - deprecated but kept for compatibility) ---
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
// @route   POST /api/snippets/:id/comment
// @desc    Add a comment to a code snippet
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ msg: 'Comment text is required' });
    }

    const snippet = await Snippet.findById(req.params.id);
    const user = await User.findById(req.user.id).select('-password');

    if (!snippet) {
      return res.status(404).json({ msg: 'Snippet not found' });
    }

    const newComment = {
      user: req.user.id,
      name: user.name, // Get name from user object
      text: text,
    };

    snippet.comments.unshift(newComment);
    await snippet.save();
    
    res.json({
      msg: 'Comment added successfully',
      comments: snippet.comments,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error while adding comment' });
  }
});

// --- Comment on a Snippet (POST to /comment/:id for backward compatibility) ---
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
// @route   POST /api/snippets/:id/report
// @desc    Report a code snippet for inappropriate content
// @access  Private
router.post('/:id/report', auth, async (req, res) => {
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
    res.json({ msg: 'Snippet reported successfully', reportCount: snippet.reports.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error while reporting snippet' });
  }
});

// --- Report a Snippet (POST to /report/:id for backward compatibility) ---
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
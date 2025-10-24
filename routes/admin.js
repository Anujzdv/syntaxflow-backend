// routes/admin.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Snippet = require('../models/Snippet');
const User = require('../models/User');

// --- Get All Reported Snippets ---
// @route   GET /api/admin/reports
// @desc    Get all snippets that have at least one report
// @access  Admin
router.get('/reports', [auth, admin], async (req, res) => {
  try {
    // Find snippets where the 'reports' array is not empty
    const reportedSnippets = await Snippet.find({
      'reports.0': { $exists: true }
    })
    .populate('user', ['name', 'email'])
    .sort({ createdAt: -1 });

    res.json(reportedSnippets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Delete a Snippet ---
// @route   DELETE /api/admin/snippet/:id
// @desc    Delete a snippet by its ID
// @access  Admin
router.delete('/snippet/:id', [auth, admin], async (req, res) => {
    try {
      const snippet = await Snippet.findById(req.params.id);
  
      if (!snippet) {
        return res.status(404).json({ msg: 'Snippet not found' });
      }

      await Snippet.findByIdAndDelete(req.params.id);
  
      res.json({ msg: 'Snippet removed successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

// --- Get All Users ---
// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', [auth, admin], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
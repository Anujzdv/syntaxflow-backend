// models/Challenge.js
const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  challenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Challenger ID is required']
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Target user ID is required']
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    enum: {
      values: ['javascript', 'react', 'python', 'nodejs'],
      message: 'Topic must be one of: javascript, react, python, nodejs'
    }
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: {
      values: ['easy', 'medium', 'hard'],
      message: 'Difficulty must be one of: easy, medium, hard'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'accepted', 'declined', 'completed'],
      message: 'Status must be one of: pending, accepted, declined, completed'
    },
    default: 'pending'
  },
  // Linked quiz for this challenge
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    default: null
  },
  // Scores and results
  challengerScore: {
    type: Number,
    default: null,
    min: [0, 'Score cannot be negative']
  },
  targetScore: {
    type: Number,
    default: null,
    min: [0, 'Score cannot be negative']
  },
  // XP earned by each player
  challengerXP: {
    type: Number,
    default: 0,
    min: [0, 'XP cannot be negative']
  },
  targetXP: {
    type: Number,
    default: 0,
    min: [0, 'XP cannot be negative']
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Completion timestamp
  completedAt: {
    type: Date,
    default: null
  },
  // Auto-expire challenges after 48 hours
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 48 * 60 * 60 * 1000),
    index: { expireAfterSeconds: 0 } // TTL index for auto-deletion
  }
}, { timestamps: true });

// Index for efficient queries
ChallengeSchema.index({ challenger: 1, createdAt: -1 });
ChallengeSchema.index({ targetUser: 1, createdAt: -1 });
ChallengeSchema.index({ status: 1 });

module.exports = mongoose.model('Challenge', ChallengeSchema);

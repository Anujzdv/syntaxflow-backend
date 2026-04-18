// models/QuizAttempt.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Answer sub-schema for storing user's responses
const AnswerSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Question ID is required'],
  },
  selectedOptionIds: [
    {
      type: Schema.Types.ObjectId,
      required: true,
    }
  ],
  isCorrect: {
    type: Boolean,
    default: false,
  },
}, { _id: true });

const QuizAttemptSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Quiz ID is required'],
  },
  answers: {
    type: [AnswerSchema],
    required: [true, 'Answers array is required'],
    default: [],
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
  },
  maxScore: {
    type: Number,
    required: [true, 'Max score is required'],
    min: [1, 'Max score must be at least 1'],
  },
  accuracy: {
    type: Number, // Percentage (0-100)
    required: [true, 'Accuracy is required'],
    min: 0,
    max: 100,
  },
  xpEarned: {
    type: Number,
    default: 0,
    min: [0, 'XP earned cannot be negative'],
  },
  timeTaken: {
    type: Number, // Time in seconds
    required: [true, 'Time taken is required'],
    min: [0, 'Time cannot be negative'],
  },
  // Security flag: marks if attempt shows suspicious behavior
  flagged: {
    type: Boolean,
    default: false,
  },
  // Reason for flagging (if flagged)
  flagReason: {
    type: String,
    default: null,
  },
  // Tab switch count or other anomalies
  tabSwitchCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Whether the user passed or failed
  passed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for efficient queries
QuizAttemptSchema.index({ userId: 1, quizId: 1 });
QuizAttemptSchema.index({ userId: 1, createdAt: -1 });
QuizAttemptSchema.index({ flagged: 1 });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);

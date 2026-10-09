// models/Quiz.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Option sub-schema for quiz questions
const OptionSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    auto: true,
  },
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
  },
  is_correct: {
    type: Boolean,
    default: false,
  },
}, { _id: true });

// Question sub-schema
const QuestionSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    auto: true,
  },
  question_text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  code_snippet: {
    type: String,
    default: null, // Optional code snippet for context
  },
  type: {
    type: String,
    enum: ['single', 'multi', 'true_false'],
    required: [true, 'Question type is required'],
  },
  explanation: {
    type: String,
    required: [true, 'Explanation is required'],
    trim: true,
  },
  tags: [
    {
      type: String,
      trim: true,
      lowercase: true,
    }
  ],
  options: {
    type: [OptionSchema],
    required: [true, 'At least one option is required'],
    validate: [
      (val) => val.length > 0,
      'Options array cannot be empty'
    ],
  },
}, { _id: true });

const QuizSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  language: {
    type: String,
    required: [true, 'Please specify the language'],
    enum: {
      values: ['Python', 'JavaScript', 'Java', 'C++', 'C'],
      message: 'Language must be one of: Python, JavaScript, Java, C++, C'
    },
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy',
  },
  xp_reward: {
    type: Number,
    default: 100,
    min: [0, 'XP reward cannot be negative'],
  },
  timeLimit: {
    type: Number, // Time in seconds
    required: [true, 'Time limit is required'],
    min: [60, 'Time limit must be at least 60 seconds'],
  },
  questions: {
    type: [QuestionSchema],
    required: [true, 'At least one question is required'],
    validate: [
      (val) => val.length > 0,
      'Quiz must contain at least one question'
    ],
  },
  passingScore: {
    type: Number, // Percentage (0-100)
    default: 60,
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100'],
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Index for better query performance
QuizSchema.index({ language: 1, difficulty: 1 });

module.exports = mongoose.model('Quiz', QuizSchema);
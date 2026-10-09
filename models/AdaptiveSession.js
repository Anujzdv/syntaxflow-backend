const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true }
}, { _id: false });

const CurrentQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  questionText: { type: String, required: true },
  codeSnippet: { type: String, default: null },
  options: { type: [OptionSchema], required: true },
  correctOptionId: { type: String, required: true },
  explanation: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  topic: { type: String, required: true },
  language: { type: String, required: true },
  source: { type: String, enum: ['curated', 'ai_generated'], default: 'curated' }
}, { _id: false });

const HistoryItemSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  selectedOptionId: { type: String, required: true },
  correctOptionId: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  source: { type: String, enum: ['curated', 'ai_generated'], default: 'curated' },
  answeredAt: { type: Date, default: Date.now }
}, { _id: false });

const AdaptiveSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  language: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    default: 'general'
  },
  currentDifficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active',
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  usedQuestionIds: {
    type: [String],
    default: []
  },
  history: {
    type: [HistoryItemSchema],
    default: []
  },
  currentQuestion: {
    type: CurrentQuestionSchema,
    default: null
  },
  consecutiveCorrect: {
    type: Number,
    default: 0
  },
  consecutiveIncorrect: {
    type: Number,
    default: 0
  },
  totalAnswered: {
    type: Number,
    default: 0
  },
  totalCorrect: {
    type: Number,
    default: 0
  },
  idempotencyKeys: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdaptiveSession', AdaptiveSessionSchema);

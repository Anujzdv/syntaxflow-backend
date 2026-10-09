// models/QuizResult.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuizResultSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  language: {
    type: String,
    required: true,
    enum: ['Python', 'JavaScript', 'Java', 'C++', 'C'],
  },
  score: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  timeTaken: {
    type: Number, // Time in seconds
    required: true,
  },
  accuracy: {
    type: Number, // Percentage
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('QuizResult', QuizResultSchema);
// models/Quiz.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuizSchema = new Schema({
  language: {
    type: String,
    required: [true, 'Please specify the language'],
    enum: ['Python', 'JavaScript', 'Java', 'C++', 'C'],
  },
  question: {
    type: String,
    required: [true, 'Please add a question'],
    trim: true,
  },
  options: {
    type: [String],
    required: [true, 'Please add options'],
    validate: [
      (val) => val.length === 4, // Ensures there are exactly 4 options
      'Please provide 4 options'
    ]
  },
  correctAnswer: {
    type: Number, // Index of the correct answer (0, 1, 2, or 3)
    required: [true, 'Please specify the correct answer index'],
    min: 0,
    max: 3,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
  }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
// models/Snippet.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SnippetSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    trim: true,
    default: 'Untitled Snippet',
  },
  description: {
    type: String,
    default: '',
  },
  code: {
    type: String,
    required: [true, 'Please add your code snippet'],
  },
  language: {
    type: String,
    required: [true, 'Please specify the language'],
    enum: ['c', 'cpp', 'java', 'html', 'python', 'javascript', 'typescript', 'react', 'nodejs', 'css', 'bash', 'sql'],
    lowercase: true,
  },
  likes: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  comments: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: { type: String, required: true }, // Store name for easy display
      text: { type: String, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
  reports: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: { type: String, default: 'Inappropriate content' },
      date: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true }); // Adds createdAt and updatedAt

module.exports = mongoose.model('Snippet', SnippetSchema);
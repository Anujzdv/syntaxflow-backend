// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 6,
    select: false, // Don't send password back in responses
  },
  bio: {
    type: String,
    default: "I'm a new user on Syntax|Flow!",
  },
  profileImage: {
    type: String,
    default: 'default_avatar.png', // URL to a default image
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, { timestamps: true }); // Adds createdAt and updatedAt fields

// --- Database Indexes for Performance ---
UserSchema.index({ email: 1 }); // Speed up email lookups during login/register
UserSchema.index({ createdAt: -1 }); // Speed up sorting by creation date

// --- Mongoose Middleware ---
// This function runs BEFORE a new user is saved to the database
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  // Generate a 'salt' to hash the password with (8 rounds = optimal speed/security)
  const salt = await bcrypt.genSalt(8);
  // Hash the password
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Mongoose Model Method ---
// Method to compare candidate password with the stored hashed password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

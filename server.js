// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const snippetRoutes = require('./routes/snippets');
const quizRoutes = require('./routes/quiz');
const leaderboardRoutes = require('./routes/leaderboard'); // <-- ADD THIS
const adminRoutes = require('./routes/admin');       // <-- ADD THIS

// Initialize Express app
const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
// (Your existing DB connection code)
mongoose.connect(process.env.MONGO_URI, { /* ... */ })
.then(() => console.log("MongoDB connected successfully."))
.catch(err => console.error("MongoDB connection error:", err));


// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/leaderboard', leaderboardRoutes); // <-- ADD THIS
app.use('/api/admin', adminRoutes);         // <-- ADD THIS

// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
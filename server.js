// server.js (New Robust Version)
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const snippetRoutes = require('./routes/snippets');
const quizRoutes = require('./routes/quiz');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// --- Define Port ---
const PORT = process.env.PORT || 5000;

// --- NEW: Database Connection & Server Start ---
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully.");

    // 2. Start the server ONLY after DB is connected
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (err) {
    // 3. If DB connection fails, log the error and exit
    console.error("MongoDB connection error:", err);
    process.exit(1); // Stop the server process
  }
};

// --- Export app and startServer for testing ---
module.exports = { app, startServer };

// --- Run the server only if this file is executed directly ---
if (require.main === module) {
  startServer();
}

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
const usersRoutes = require('./routes/users');
const challengesRoutes = require('./routes/challenges');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// --- Middlewares ---
// CORS configuration - allow requests from frontend
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://syntaxflow.tech',
      process.env.FRONTEND_URL
      'https://syntaxflow-frontend.pages.dev' // ✅ this is add for cloudflare fronted deployed (manually)
    ].filter(Boolean); // Remove undefined values
    
    // Allow requests with no origin (like mobile or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Request timeout middleware (30 seconds)
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ msg: 'Request timeout - server took too long to respond' });
  });
  next();
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quiz', quizRoutes); // Legacy path for backward compatibility
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/admin', adminRoutes);

// --- Define Port ---
const PORT = process.env.PORT || 5000;

// --- NEW: Database Connection & Server Start ---
const startServer = async () => {
  let dbConnected = false;
  
  try {
    // 1. Connect to MongoDB with optimized connection pooling
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,        // Maximum connection pool size
      minPoolSize: 5,         // Minimum connection pool size
      socketTimeoutMS: 45000, // Socket timeout
      serverSelectionTimeoutMS: 5000, // Server selection timeout
      retryWrites: true,      // Retry writes for better reliability
    });
    console.log("✓ MongoDB connected successfully.");
    dbConnected = true;
  } catch (err) {
    // Connection failed - but we'll still start the server in demo mode
    console.warn("⚠️  MongoDB connection failed. Running in DEMO MODE with sample data.");
    console.warn("Error:", err.message);
    dbConnected = false;
  }

  // 2. Start the server regardless of DB connection
  // (For demo/development mode with sample data)
  app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    if (!dbConnected) {
      console.log("📚 Using sample quiz data (not persisted)");
    }
  });
};

// --- Export app and startServer for testing ---
module.exports = { app, startServer };

// --- Run the server only if this file is executed directly ---
if (require.main === module) {
  startServer();
}

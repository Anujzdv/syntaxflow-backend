// server.js
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
const adaptiveRoutes = require('./routes/adaptive');

// Initialize Express app
const app = express();

// --- Middlewares ---
// CORS configuration - allow requests from frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile or curl requests)
    if (!origin) return callback(null, true);

    const configured = (process.env.FRONTEND_URL || '')
      .split(',')
      .map(s => s.trim().replace(/\/$/, ''))
      .filter(Boolean);

    const defaultOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
      'https://syntaxflow.tech',
      'https://syntaxflow.netlify.app'
    ];

    const allowedOrigins = [...defaultOrigins, ...configured];
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isExplicitlyAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes(normalizedOrigin);

    let isDomainAllowed = false;
    try {
      const hostname = new URL(origin).hostname;
      isDomainAllowed = (
        hostname.endsWith('.vercel.app') ||
        hostname.endsWith('.netlify.app') ||
        hostname.endsWith('.onrender.com') ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1'
      );
    } catch (e) {}

    if (isExplicitlyAllowed || isDomainAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(null, false);
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
    res.status(408).json({ message: 'Request timeout - server took too long to respond', msg: 'Request timeout - server took too long to respond' });
  });
  next();
});

// --- Health Check Endpoints ---
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/health/ready', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (isDbConnected) {
    return res.status(200).json({ status: 'ready', database: 'connected' });
  }
  return res.status(503).json({ status: 'not_ready', database: 'disconnected' });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/quizzes/adaptive', adaptiveRoutes);
app.use('/api/quiz/adaptive', adaptiveRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quiz', quizRoutes); // Legacy path for backward compatibility
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/admin', adminRoutes);

// --- Define Port ---
const PORT = process.env.PORT || 5000;

// --- Database Connection & Server Start ---
const startServer = async () => {
  let dbConnected = false;
  
  try {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri && process.env.NODE_ENV !== 'production') {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const memoryServer = await MongoMemoryServer.create();
        mongoUri = memoryServer.getUri();
        console.log("⚡ [Dev Mode] Launched in-memory MongoDB instance at:", mongoUri);
      } catch (memErr) {
        console.warn("Could not launch MongoMemoryServer:", memErr.message);
      }
    }

    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
    });
    console.log("✓ MongoDB connected successfully.");
    dbConnected = true;
  } catch (err) {
    console.warn("⚠️  MongoDB connection failed:", err.message);
    dbConnected = false;
    if (process.env.NODE_ENV === 'production') {
      console.error("FATAL: Cannot run in production without MongoDB connection.");
      process.exit(1);
    }
  }

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    if (!dbConnected) {
      console.warn("⚠️  Database is offline. Readiness probes will report 503.");
    }
  });

  return server;
};

// --- Export app and startServer for testing ---
module.exports = { app, startServer };

// --- Run the server only if this file is executed directly ---
if (require.main === module) {
  startServer();
}

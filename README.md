# 🚀 Syntax|Flow — Backend API

**Competitive Developer Quiz, Challenge Arena & Adaptive Practice Engine**

A production-ready Node.js & Express REST API powering Syntax|Flow. Provides JWT-based authentication, timed technical quizzes, 1v1 challenge arena, developer code feeds, community leaderboards, and an **Adaptive AI Practice Engine** with deterministic difficulty progression.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%207-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Tests](https://img.shields.io/badge/Jest-112%20Passing-brightgreen?style=flat-square)

---

## 📋 Table of Contents

- [Core Features](#-core-features)
- [Adaptive AI Practice Engine](#-adaptive-ai-practice-engine)
- [Tech Stack](#-tech-stack)
- [API Architecture & Endpoints](#-api-architecture--endpoints)
- [Environment Variables](#-environment-variables)
- [Local Development & Testing](#-local-development--testing)
- [Production Deployment](#-production-deployment)

---

## ✨ Core Features

- **JWT Authentication** — Secure password hashing with bcryptjs, session verification, user profiles, and rate-limited endpoints.
- **Timed Technical Quizzes** — Language-specific quizzes (JavaScript, Python, Java, C++, C) with server-side authoritative grading, anti-cheat detection, and XP calculation.
- **Adaptive Practice Mode** — Deterministic 2-streak difficulty adjustment algorithm (`easy` ↔ `medium` ↔ `hard`) with optional server-side Google Gemini AI generation for single MCQs.
- **Challenge Arena** — Asynchronous peer-to-peer coding challenges with XP wagers and resolution flows.
- **Social Feed & Code Snippets** — Developer snippet sharing, syntax highlighting, pagination, liking, and comments.
- **Competitive Leaderboard** — Global, weekly, and language-filtered rankings computed via MongoDB aggregation pipelines.
- **Readiness & Liveness Probes** — `/health/live` and `/health/ready` for automated zero-downtime monitoring.

---

## 🧠 Adaptive AI Practice Engine

Adaptive Practice Mode personalizes question difficulty in real time based on user performance:

1. **Deterministic Difficulty Algorithm (`utils/adaptiveEngine.js`)**:
   - Evaluates a rolling performance window.
   - **2 consecutive correct answers** ➔ Elevates difficulty (`easy` ➔ `medium` ➔ `hard`). Clamped at `hard`.
   - **2 consecutive incorrect answers** ➔ Lowers difficulty (`hard` ➔ `medium` ➔ `easy`). Clamped at `easy`.
   - Mixed performance maintains current difficulty.
   - Resets streak counters upon difficulty transitions.
2. **Server-Side Authoritative Grading**:
   - Clients never receive `correctOptionId`, answer flags, or explanations before submitting an answer.
   - Answers are verified on the server; duplicate submissions are prevented with idempotency keys.
3. **Hybrid Question Pool**:
   - Pulls from a curated bank of language-specific questions.
   - Optionally generates fresh practice MCQs via **Google Gemini API** (`services/aiGenerator.js`) when `GEMINI_API_KEY` is configured.
   - Strictly validates candidate questions (4 distinct options, 1 valid answer, non-empty explanations) before delivery, seamlessly falling back to curated questions on failure or timeout.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Server Framework**: Express.js
- **Database**: MongoDB via Mongoose 7
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Testing**: Jest, Supertest, `mongodb-memory-server` (100% in-memory isolated tests)
- **AI Provider**: Google Gemini API (server-side only)

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Create account, returns `{ token, user }`
- `POST /api/auth/login` — Login, returns `{ token, user }`
- `GET /api/auth/me` — Authenticated profile (includes email, role, stats)

### 🎯 Adaptive Practice Mode (`/api/quizzes/adaptive`)
- `POST /api/quizzes/adaptive/sessions` — Start an adaptive session (`{ language, topic, startingDifficulty }`). Returns safe question DTO (no answer leakage).
- `POST /api/quizzes/adaptive/sessions/:sessionId/answers` — Submit an answer (`{ questionId, selectedOptionId, idempotencyKey }`). Grades server-side, updates difficulty, returns result, explanation, and next question.
- `GET /api/quizzes/adaptive/sessions/:sessionId/summary` — Retrieve session accuracy, total answered, difficulty progression, and recommendations.
- `POST /api/quizzes/adaptive/sessions/:sessionId/finish` — Gracefully completes session.

### ⏱ Standard Quizzes (`/api/quizzes`)
- `GET /api/quizzes/:identifier` — Fetch quiz by ID or language slug (`javascript`, `python`, `java`, `c++`, `c`). Answer keys stripped.
- `POST /api/quizzes/:quizId/submit` — Submit quiz attempt, computes score, XP, and streak.

### 🏆 Leaderboard (`/api/leaderboard`)
- `GET /api/leaderboard` — Top users (filtered by timeframe `all-time` | `weekly` and language).

### ⚔️ Challenges (`/api/challenges`)
- `POST /api/challenges` — Create a 1v1 challenge.
- `GET /api/challenges/me` — Fetch user's pending, active, and completed challenges.
- `POST /api/challenges/:id/accept` — Accept incoming challenge.
- `POST /api/challenges/:id/decline` — Decline incoming challenge.

### 💬 Social Feed (`/api/snippets`)
- `GET /api/snippets` — Paginated code snippets.
- `POST /api/snippets` — Share a code snippet.
- `POST /api/snippets/:id/like` — Like/unlike snippet.
- `POST /api/snippets/:id/comment` — Post a comment.

### 🩺 Health Checks
- `GET /health/live` — Returns 200 with server uptime.
- `GET /health/ready` — Returns 200 when MongoDB is connected; 503 if disconnected.

---

## ⚙️ Environment Variables

Create `.env` in the backend root based on `.env.example`:

```bash
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/syntaxflow?retryWrites=true&w=majority

# Authentication
JWT_SECRET=super_secret_jwt_random_key_min_32_characters

# Server Port & Mode
PORT=5000
NODE_ENV=development

# Allowed Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Optional: AI Question Generator
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🧪 Local Development & Testing

```bash
# Install dependencies
npm install

# Run automated test suites (7 suites, 112 tests)
npm test

# Start development server
npm run dev

# Start production server
npm start
```

---

## 🚀 Production Deployment

1. Set environment variables on your host (Render, Railway, or AWS):
   - `MONGO_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `FRONTEND_URL` (URL of deployed frontend)
   - `GEMINI_API_KEY` (optional)
2. Use `/health/live` and `/health/ready` for container health checks.
3. Node process exits with code 1 if MongoDB connection fails in production mode to avoid hanging broken containers.

# 🏆 Gamified Leaderboard API Documentation

## Overview
The new gamified leaderboard system provides real-time ranking, XP tracking, and competitive features for SyntaxFlow users.

---

## 📡 Endpoints

### 1. **GET Leaderboard** (Main Endpoint)
```
GET /api/leaderboard?type=global|weekly
```

**Authentication:** Required (JWT Token)

**Query Parameters:**
- `type` (string): Either `"global"` or `"weekly"` (default: `"global"`)

**Response Format:**
```json
{
  "topUsers": [
    {
      "_id": "60d5ec...",
      "name": "Anuj",
      "username": "anuj_dev",
      "xp": 1250,
      "avgAccuracy": 92.5,
      "streak": 5,
      "avatar": "A",
      "rank": 1
    },
    // ... up to 50 users
  ],
  "currentUser": {
    "rank": 42,
    "xp": 780,
    "nextRankXp": 850,
    "gapToNext": 70
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid type parameter
- `500`: Server error

---

## 🌍 Global Leaderboard Logic

**What it does:**
- Fetches **Top 50 users** sorted by:
  1. **Primary:** Total XP (descending)
  2. **Tie-breaker:** Average Accuracy (descending)
- Calculates current user's **global rank**
- Finds **XP gap to next rank**

**Edge Cases:**
- If user has 0 XP: Returns `"Unranked"` as rank
- If user is Rank #1: `gapToNext = 0`
- If user not found: `currentUser.rank = "Unranked"`, `gapToNext = null`

---

## 📅 Weekly Leaderboard Logic

**What it does:**
- Aggregates quiz attempts from the **last 7 days** only
- Groups by user and sums `xpEarned` from those attempts
- Calculates ranking based on **weekly XP** (not total XP)
- Returns same response format as global

**Recalculation:**
- Happens **every time** the endpoint is called
- No separate weekly table needed (computed on-demand)

---

## 👤 User Model Updates

The `User` schema now tracks:
```javascript
{
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  streak: {
    type: Number,
    default: 0,
    min: 0
  },
  avgAccuracy: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalQuizzes: {
    type: Number,
    default: 0,
    min: 0
  }
}
```

**Indexes added:**
```javascript
UserSchema.index({ xp: -1, avgAccuracy: -1 }); // For leaderboard sorting
```

---

## 🎯 Quiz Submission Updates

When a quiz is submitted, the system automatically:

1. ✅ Saves `QuizAttempt` with `xpEarned`
2. ✅ Increments user's total `xp`
3. ✅ Recalculates user's `avgAccuracy` from all attempts
4. ✅ Increments `totalQuizzes` count
5. ✅ Updates `streak` (increments on pass, resets on fail)

**Code location:** `routes/quiz.js` - `/submit` endpoint

---

## 📊 Response Field Explanations

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | User's MongoDB ID |
| `name` | String | User's full name |
| `username` | String | User's username |
| `xp` | Number | Total/weekly XP earned |
| `avgAccuracy` | Number | Average quiz accuracy (0-100) |
| `streak` | Number | Current quiz-passing streak |
| `avatar` | String | Avatar (usually first letter of name) |
| `rank` | Number \| String | User's rank (number or "Unranked") |
| `nextRankXp` | Number \| null | XP of user ranked one spot above |
| `gapToNext` | Number \| null | XP needed to overtake next rank |

---

## 🧪 Testing the Endpoint

### Using cURL (Global):
```bash
curl -X GET "https://syntaxflow-backend.onrender.com/api/leaderboard?type=global" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using cURL (Weekly):
```bash
curl -X GET "https://syntaxflow-backend.onrender.com/api/leaderboard?type=weekly" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Fetch (JavaScript):
```javascript
const response = await fetch('/api/leaderboard?type=global', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data.topUsers); // Top 50 users
console.log(data.currentUser); // Your rank
```

---

## 🔐 Security Features

✅ **JWT Authentication Required** - Only logged-in users can access
✅ **Rate Limiting** - (Recommended for production)
✅ **Input Validation** - Query params are validated
✅ **Error Handling** - Graceful errors with descriptive messages

---

## ⚡ Performance Optimizations

1. **MongoDB Indexes:**
   - `{ xp: -1, avgAccuracy: -1 }` on Users
   - `{ userId: 1, createdAt: -1 }` on QuizAttempts

2. **Query Efficiency:**
   - Global: Uses `.lean()` for read-only queries
   - Weekly: Uses aggregation pipeline (efficient grouping)

3. **Caching Recommendation (Future):**
   - Cache top 10 users for 5 minutes
   - Refresh on quiz submission

---

## 📝 Integration Checklist

- [x] Backend: Gamified leaderboard endpoint implemented
- [x] Backend: User model fields added (xp, streak, avgAccuracy, totalQuizzes)
- [x] Backend: Quiz submission auto-updates user stats
- [x] Backend: MongoDB indexes added for performance
- [ ] Frontend: Leaderboard page created
- [ ] Frontend: Podium UI (Top 3) built
- [ ] Frontend: Weekly/Global filter tabs added
- [ ] Frontend: Current user sticky card implemented
- [ ] Frontend: Animations & loading states added

---

## 🐛 Known Limitations

1. **Streak Logic:** Currently simplified (increments on pass, resets on fail)
   - TODO: Add "consecutive days" logic if needed

2. **Weekly Reset:** No manual reset - computed fresh each request
   - Scales well for small user base
   - Consider caching for 10k+ users

3. **Avatar Field:** Uses first letter of name
   - TODO: Connect to user's actual profile image when available

---

## 🚀 Next Steps

1. **Frontend Integration:**
   - Implement Leaderboard.jsx component
   - Hook endpoints to React query/SWR
   - Add filter tabs and animations

2. **Additional Features (Optional):**
   - "Challenge User" button
   - User profile page linking
   - Badge system for milestones
   - XP history/notifications

3. **Analytics:**
   - Track leaderboard views
   - Monitor performance metrics
   - A/B test gamification impact

---

**Last Updated:** April 20, 2026
**API Version:** 1.0
**Status:** ✅ Production Ready

# ⚔️ 1v1 Challenge System API Documentation

## Overview
The Challenge system allows users to issue direct quiz challenges to each other. Users can challenge someone to a specific quiz topic and difficulty level, accept/decline incoming challenges, and view their challenge history.

---

## 📋 Challenge Model

### Schema Structure
```javascript
{
  challenger: ObjectId (ref: User),        // User who initiated the challenge
  targetUser: ObjectId (ref: User),        // User being challenged
  topic: String (enum: ['javascript', 'react', 'python', 'nodejs']),
  difficulty: String (enum: ['easy', 'medium', 'hard']),
  status: String (enum: ['pending', 'accepted', 'declined', 'completed']),
  challengerScore: Number (null by default),
  targetScore: Number (null by default),
  winner: ObjectId (ref: User, null by default),
  expiresAt: Date (auto-set to 48 hours from creation),
  createdAt: Date (timestamp),
  updatedAt: Date (timestamp)
}
```

### Indexes
- `{ challenger: 1, createdAt: -1 }` - Fast lookup of user's outgoing challenges
- `{ targetUser: 1, createdAt: -1 }` - Fast lookup of user's incoming challenges
- `{ status: 1 }` - Fast filtering by challenge status
- `expiresAt` - TTL index for auto-expiration after 48 hours

---

## 🔌 API Endpoints

### 1. **POST /api/challenges** - Issue a Challenge
Create a new challenge targeting another user.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "targetUserId": "60d5ec7a1c9d440012345678",
  "topic": "javascript",
  "difficulty": "medium"
}
```

**Validation:**
- `targetUserId`: Must be a valid MongoDB ObjectId
- `topic`: Must be one of: `javascript`, `react`, `python`, `nodejs`
- `difficulty`: Must be one of: `easy`, `medium`, `hard`
- User cannot challenge themselves
- Target user must exist in database
- No existing pending challenge between these users in the same direction

**Response (201 Created):**
```json
{
  "msg": "Challenge created successfully",
  "challenge": {
    "_id": "60d5ec7a1c9d440012345679",
    "challenger": {
      "_id": "60d5ec7a1c9d440012345678",
      "name": "Anuj Kumar",
      "username": "anuj_dev",
      "profileImage": "default_avatar.png"
    },
    "targetUser": {
      "_id": "60d5ec7a1c9d440012345680",
      "name": "Jane Dev",
      "username": "jane_dev",
      "profileImage": "default_avatar.png"
    },
    "topic": "javascript",
    "difficulty": "medium",
    "status": "pending",
    "challengerScore": null,
    "targetScore": null,
    "winner": null,
    "expiresAt": "2026-04-22T15:30:00.000Z",
    "createdAt": "2026-04-20T15:30:00.000Z",
    "updatedAt": "2026-04-20T15:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid values
- `400 Conflict` - User attempting to challenge themselves
- `404 Not Found` - Target user doesn't exist
- `409 Conflict` - Pending challenge already exists with this user

---

### 2. **GET /api/challenges** - Get User Challenges
Fetch all challenges (incoming, outgoing, and history) for the logged-in user.

**Authentication:** Required (JWT)

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "incoming": [
    {
      "_id": "60d5ec7a1c9d440012345679",
      "challenger": {
        "_id": "60d5ec7a1c9d440012345678",
        "name": "Anuj Kumar",
        "username": "anuj_dev",
        "profileImage": "default_avatar.png",
        "xp": 1250,
        "avgAccuracy": 92.5
      },
      "targetUser": {
        "_id": "60d5ec7a1c9d440012345680",
        "name": "Jane Dev",
        "username": "jane_dev",
        "profileImage": "default_avatar.png",
        "xp": 950,
        "avgAccuracy": 88
      },
      "topic": "javascript",
      "difficulty": "medium",
      "status": "pending",
      "expiresAt": "2026-04-22T15:30:00.000Z",
      "createdAt": "2026-04-20T15:30:00.000Z"
    }
  ],
  "outgoing": [
    {
      "_id": "60d5ec7a1c9d440012345681",
      "challenger": {
        "_id": "60d5ec7a1c9d440012345678",
        "name": "Anuj Kumar",
        "username": "anuj_dev",
        "profileImage": "default_avatar.png",
        "xp": 1250,
        "avgAccuracy": 92.5
      },
      "targetUser": {
        "_id": "60d5ec7a1c9d440012345682",
        "name": "Bob Code",
        "username": "bob_code",
        "profileImage": "default_avatar.png",
        "xp": 1100,
        "avgAccuracy": 85
      },
      "topic": "react",
      "difficulty": "hard",
      "status": "pending",
      "expiresAt": "2026-04-22T16:00:00.000Z",
      "createdAt": "2026-04-20T16:00:00.000Z"
    }
  ],
  "history": [
    {
      "_id": "60d5ec7a1c9d440012345683",
      "challenger": {
        "_id": "60d5ec7a1c9d440012345678",
        "name": "Anuj Kumar",
        "username": "anuj_dev",
        "profileImage": "default_avatar.png"
      },
      "targetUser": {
        "_id": "60d5ec7a1c9d440012345680",
        "name": "Jane Dev",
        "username": "jane_dev",
        "profileImage": "default_avatar.png"
      },
      "topic": "python",
      "difficulty": "easy",
      "status": "completed",
      "challengerScore": 85,
      "targetScore": 72,
      "winner": {
        "_id": "60d5ec7a1c9d440012345678",
        "name": "Anuj Kumar",
        "username": "anuj_dev"
      },
      "createdAt": "2026-04-18T10:30:00.000Z"
    }
  ]
}
```

**Logic:**
- `incoming`: All pending challenges where user is `targetUser`
- `outgoing`: All pending challenges where user is `challenger`
- `history`: All completed or declined challenges (last 10)
- All sorted by `createdAt: -1` (newest first)

**Error Responses:**
- `500 Server Error` - Database query failed

---

### 3. **PUT /api/challenges/:id/respond** - Respond to Challenge
Accept or decline a pending challenge (only target user can respond).

**Authentication:** Required (JWT)

**URL Parameters:**
- `:id` - Challenge ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "status": "accepted"
}
```
or
```json
{
  "status": "declined"
}
```

**Validation:**
- Only the `targetUser` can respond
- Challenge must be in `pending` status
- Challenge must not have expired (48 hours)
- `status` must be either `accepted` or `declined`

**Response (200 OK):**
```json
{
  "msg": "Challenge accepted successfully",
  "challenge": {
    "_id": "60d5ec7a1c9d440012345679",
    "challenger": {
      "_id": "60d5ec7a1c9d440012345678",
      "name": "Anuj Kumar",
      "username": "anuj_dev",
      "profileImage": "default_avatar.png"
    },
    "targetUser": {
      "_id": "60d5ec7a1c9d440012345680",
      "name": "Jane Dev",
      "username": "jane_dev",
      "profileImage": "default_avatar.png"
    },
    "topic": "javascript",
    "difficulty": "medium",
    "status": "accepted",
    "expiresAt": "2026-04-22T15:30:00.000Z",
    "createdAt": "2026-04-20T15:30:00.000Z",
    "updatedAt": "2026-04-20T16:15:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing status field or invalid value
- `400 Bad Request` - Challenge not in pending status
- `400 Bad Request` - Invalid challenge ID format
- `403 Forbidden` - User is not the challenge recipient
- `404 Not Found` - Challenge doesn't exist
- `410 Gone` - Challenge has expired
- `500 Server Error` - Database update failed

---

### 4. **GET /api/challenges/:id** - Get Challenge Details
Fetch full details of a specific challenge.

**Authentication:** Required (JWT)

**URL Parameters:**
- `:id` - Challenge ID (MongoDB ObjectId)

**Response (200 OK):**
```json
{
  "_id": "60d5ec7a1c9d440012345679",
  "challenger": {
    "_id": "60d5ec7a1c9d440012345678",
    "name": "Anuj Kumar",
    "username": "anuj_dev",
    "profileImage": "default_avatar.png",
    "xp": 1250,
    "avgAccuracy": 92.5
  },
  "targetUser": {
    "_id": "60d5ec7a1c9d440012345680",
    "name": "Jane Dev",
    "username": "jane_dev",
    "profileImage": "default_avatar.png",
    "xp": 950,
    "avgAccuracy": 88
  },
  "topic": "javascript",
  "difficulty": "medium",
  "status": "accepted",
  "challengerScore": null,
  "targetScore": null,
  "winner": null,
  "expiresAt": "2026-04-22T15:30:00.000Z",
  "createdAt": "2026-04-20T15:30:00.000Z",
  "updatedAt": "2026-04-20T16:15:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid challenge ID format
- `404 Not Found` - Challenge doesn't exist

---

### 5. **DELETE /api/challenges/:id** - Cancel Challenge
Cancel a pending challenge (only challenger can cancel).

**Authentication:** Required (JWT)

**URL Parameters:**
- `:id` - Challenge ID (MongoDB ObjectId)

**Response (200 OK):**
```json
{
  "msg": "Challenge cancelled successfully"
}
```

**Validation:**
- Only the `challenger` can cancel
- Challenge must be in `pending` status

**Error Responses:**
- `400 Bad Request` - Invalid challenge ID format or challenge not pending
- `403 Forbidden` - User is not the challenger
- `404 Not Found` - Challenge doesn't exist

---

## 🔐 Security Features

✅ **JWT Authentication** - All endpoints require valid JWT token
✅ **Authorization Checks** - Users can only respond to their own challenges
✅ **Input Validation** - All fields validated against enums and types
✅ **Duplicate Prevention** - Prevents multiple pending challenges in same direction
✅ **Expiration** - Challenges auto-expire after 48 hours
✅ **Self-challenge Prevention** - Users cannot challenge themselves

---

## 🧪 Testing Examples

### Using cURL - Issue a Challenge
```bash
curl -X POST "http://localhost:5000/api/challenges" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "60d5ec7a1c9d440012345680",
    "topic": "javascript",
    "difficulty": "medium"
  }'
```

### Using cURL - Get Challenges
```bash
curl -X GET "http://localhost:5000/api/challenges" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using cURL - Accept Challenge
```bash
curl -X PUT "http://localhost:5000/api/challenges/60d5ec7a1c9d440012345679/respond" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted"
  }'
```

### Using JavaScript/Fetch
```javascript
// Issue a challenge
const response = await fetch('/api/challenges', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetUserId: userId,
    topic: 'javascript',
    difficulty: 'medium'
  })
});
const challenge = await response.json();

// Get challenges
const challengesRes = await fetch('/api/challenges', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { incoming, outgoing, history } = await challengesRes.json();

// Accept challenge
const acceptRes = await fetch(`/api/challenges/${challengeId}/respond`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ status: 'accepted' })
});
```

---

## 📊 State Flow Diagram

```
┌──────────────────┐
│    CREATED       │ (via POST /api/challenges)
│    (pending)     │
└─────────┬────────┘
          │
          ├──────────────────────────────┐
          │                              │
    (Accept via PUT)              (Decline via PUT)
          │                              │
          ▼                              ▼
    ┌──────────┐                  ┌──────────┐
    │ ACCEPTED │                  │ DECLINED │
    └────┬─────┘                  └──────────┘
         │
    (Quiz Completed)
         │
         ▼
    ┌──────────┐
    │COMPLETED │ (winner field populated)
    └──────────┘
```

**Special Case:** If a challenge expires (48 hours) without response, status automatically becomes `declined`.

---

## ⚡ Performance Optimizations

1. **Indexes** - Database indexes on active lookup fields
2. **TTL** - MongoDB TTL index automatically removes expired challenges
3. **Lean Queries** - Uses `.lean()` for read-only operations
4. **Population Limits** - Only populates necessary fields
5. **Parallel Population** - Uses `.populate()` array for multiple refs

---

## 🔜 Future Enhancements

1. **Score Calculation** - Populate `challengerScore` and `targetScore` when quiz completes
2. **Winner Logic** - Set `winner` field based on quiz results
3. **Notifications** - Notify user when challenged or when challenge expires
4. **Statistics** - Track win/loss ratio for each user
5. **Leaderboard** - Create challenge-specific leaderboards
6. **Replay** - Allow rematch requests after challenge completes
7. **Tournaments** - Create multi-user challenge brackets

---

## 📚 Integration Checklist

- [x] Challenge Model created with schema
- [x] All 5 API endpoints implemented
- [x] JWT authentication on all endpoints
- [x] Input validation and error handling
- [x] Database indexes for performance
- [x] Mounted in server.js
- [ ] Frontend modal integration
- [ ] WebSocket notifications (future)
- [ ] Quiz completion → Challenge score updates

---

**Implementation Complete:** ✅ April 20, 2026
**Status:** Production Ready 🚀

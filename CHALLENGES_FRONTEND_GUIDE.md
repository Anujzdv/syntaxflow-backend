# 🎮 Challenge System - Frontend Integration Guide

## Quick Start

The backend 1v1 Challenge system is **fully implemented and deployed**. Your frontend can immediately start using these endpoints to power the challenge modal and challenge management features.

---

## 🔌 Endpoints Quick Reference

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| **POST** | `/api/challenges` | Issue a challenge | ✅ Required |
| **GET** | `/api/challenges` | Get all challenges | ✅ Required |
| **GET** | `/api/challenges/:id` | Get challenge details | ✅ Required |
| **PUT** | `/api/challenges/:id/respond` | Accept/decline challenge | ✅ Required |
| **DELETE** | `/api/challenges/:id` | Cancel challenge | ✅ Required |

---

## 📝 Implementation Steps

### Step 1: Issue a Challenge (From Profile Modal)
```javascript
const issueChallenge = async (targetUserId, topic, difficulty) => {
  const response = await fetch('/api/challenges', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      targetUserId,
      topic,
      difficulty
    })
  });

  if (response.ok) {
    const { challenge } = await response.json();
    console.log('Challenge created:', challenge);
    // Show success toast/notification
    // Close modal
    return challenge;
  } else {
    const error = await response.json();
    // Show error toast with error.msg
    throw error;
  }
};
```

### Step 2: Fetch User Challenges
```javascript
const fetchChallenges = async () => {
  const response = await fetch('/api/challenges', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  const { incoming, outgoing, history } = await response.json();
  
  return {
    incoming,    // Challenges you need to respond to
    outgoing,    // Challenges you sent
    history      // Completed and declined challenges
  };
};
```

### Step 3: Respond to Challenge
```javascript
const respondToChallenge = async (challengeId, status) => {
  // status = "accepted" or "declined"
  
  const response = await fetch(`/api/challenges/${challengeId}/respond`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });

  const { challenge } = await response.json();
  return challenge;
};
```

---

## 🚀 React Integration Example

### Hook for Challenge Management
```javascript
import { useState, useEffect } from 'react';

export function useChallenges() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/challenges', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
      setHistory(data.history);
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const issueChallenge = async (targetUserId, topic, difficulty) => {
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId, topic, difficulty })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.msg);
      }
      
      const { challenge } = await res.json();
      setOutgoing([challenge, ...outgoing]);
      return challenge;
    } catch (err) {
      throw err;
    }
  };

  const respondToChallenge = async (challengeId, status) => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/respond`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const { challenge } = await res.json();
      
      // Update local state
      setIncoming(incoming.filter(c => c._id !== challengeId));
      if (status === 'accepted') {
        setOutgoing([challenge, ...outgoing]);
      }
      
      return challenge;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  return {
    incoming,
    outgoing,
    history,
    loading,
    fetchChallenges,
    issueChallenge,
    respondToChallenge
  };
}
```

### Challenge Modal Component
```javascript
import { useState } from 'react';
import { useChallenges } from './hooks/useChallenges';

export function ChallengeModal({ isOpen, onClose, targetUser }) {
  const [topic, setTopic] = useState('javascript');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { issueChallenge } = useChallenges();

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await issueChallenge(targetUser._id, topic, difficulty);
      // Show success message
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <h2>Challenge {targetUser.name}</h2>
      
      <div>
        <label>Topic</label>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="javascript">JavaScript</option>
          <option value="react">React</option>
          <option value="python">Python</option>
          <option value="nodejs">Node.js</option>
        </select>
      </div>

      <div>
        <label>Difficulty</label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}

      <button 
        onClick={handleSubmit} 
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Sending...' : 'Challenge!'}
      </button>
      
      <button onClick={onClose} className="btn-secondary">
        Cancel
      </button>
    </div>
  );
}
```

### Challenge List Component
```javascript
export function ChallengeList() {
  const { incoming, outgoing, respondToChallenge } = useChallenges();

  return (
    <div className="challenges-container">
      <h2>Incoming Challenges</h2>
      <div className="challenge-list">
        {incoming.map(challenge => (
          <div key={challenge._id} className="challenge-card">
            <div className="challenge-header">
              <img 
                src={challenge.challenger.profileImage} 
                alt={challenge.challenger.name}
                className="avatar"
              />
              <div>
                <h3>{challenge.challenger.name}</h3>
                <p>{challenge.topic.toUpperCase()} • {challenge.difficulty}</p>
              </div>
            </div>
            <div className="challenge-actions">
              <button 
                onClick={() => respondToChallenge(challenge._id, 'accepted')}
                className="btn-accept"
              >
                Accept
              </button>
              <button 
                onClick={() => respondToChallenge(challenge._id, 'declined')}
                className="btn-decline"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2>Outgoing Challenges</h2>
      <div className="challenge-list">
        {outgoing.map(challenge => (
          <div key={challenge._id} className="challenge-card">
            <div className="challenge-header">
              <img 
                src={challenge.targetUser.profileImage} 
                alt={challenge.targetUser.name}
                className="avatar"
              />
              <div>
                <h3>Challenging {challenge.targetUser.name}</h3>
                <p>{challenge.topic.toUpperCase()} • {challenge.difficulty}</p>
                <p className="status">Waiting for response...</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎯 Challenge Modal Placement

The modal should appear when clicking "⚔️ Challenge" button on a user's profile:

```
Profile Page
├── User Header (Name, Rank, XP)
├── [Buttons]
│   ├── [Message]
│   ├── [Follow]
│   └── [⚔️ Challenge] ← Triggers modal
└── User Stats
```

---

## 📊 Status Flow for Frontend

```javascript
// Challenge states your frontend should handle:

const CHALLENGE_STATES = {
  PENDING: 'pending',      // Awaiting response
  ACCEPTED: 'accepted',    // Accepted, ready to play
  DECLINED: 'declined',    // Declined, hidden from user
  COMPLETED: 'completed',  // Quiz finished, has winner
  EXPIRED: 'declined'      // Auto-declined after 48h
};

// UI Behavior:
// 1. PENDING (incoming) → Show "Accept/Decline" buttons
// 2. PENDING (outgoing) → Show "Waiting..." badge
// 3. ACCEPTED → Show "Start Quiz" button (or auto-start)
// 4. COMPLETED → Show winner + scores in history
// 5. DECLINED → Move to history, don't show action buttons
```

---

## ✅ Error Handling

```javascript
const handleError = (response) => {
  switch (response.status) {
    case 400:
      return 'Invalid request. Check your input.';
    case 403:
      return 'You don\'t have permission for this action.';
    case 404:
      return 'Challenge or user not found.';
    case 409:
      return 'You already have a pending challenge with this user.';
    case 410:
      return 'This challenge has expired (48 hours).';
    case 500:
      return 'Server error. Try again later.';
    default:
      return 'An error occurred.';
  }
};
```

---

## 🔔 Real-Time Updates (Optional)

For better UX, consider polling or WebSocket:

```javascript
// Simple polling solution
useEffect(() => {
  const interval = setInterval(() => {
    fetchChallenges();
  }, 5000); // Poll every 5 seconds

  return () => clearInterval(interval);
}, []);
```

---

## 🎮 Challenge Flow Example

1. **User A** clicks "Challenge" on **User B's** profile
2. Modal opens with topic/difficulty selection
3. User A submits → Challenge created with status `pending`
4. User B sees notification in **Incoming Challenges**
5. User B accepts → Challenge status becomes `accepted`
6. System redirects both users to start quiz or scheduled date
7. Quiz completes → Challenge status becomes `completed` + winner set
8. Both users see result in challenge history

---

## 📚 Response Format Reference

### Challenge Object (Full Structure)
```json
{
  "_id": "60d5ec7a1c9d440012345679",
  "challenger": {
    "_id": "60d5ec7a1c9d440012345678",
    "name": "Anuj",
    "username": "anuj_dev",
    "profileImage": "url_or_path"
  },
  "targetUser": {
    "_id": "60d5ec7a1c9d440012345680",
    "name": "Jane",
    "username": "jane_dev",
    "profileImage": "url_or_path"
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
```

---

## 🐛 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "You cannot challenge yourself" | targetUserId = currentUserId | Check user IDs before submitting |
| "Challenge already exists" | Pending challenge exists | Check outgoing challenges first |
| "Challenge not found" | Valid ID but doesn't exist | Refresh challenge list |
| "Only recipient can respond" | Non-target user responding | Verify user role |
| "Challenge has expired" | Challenge older than 48h | Show message to user |

---

## 📋 Testing Checklist

- [ ] Can issue challenge to another user
- [ ] Cannot issue challenge to self
- [ ] Cannot issue duplicate pending challenge
- [ ] See incoming challenges on challenge list
- [ ] See outgoing challenges on challenge list
- [ ] Can accept incoming challenge
- [ ] Can decline incoming challenge
- [ ] Cannot respond to non-own challenges
- [ ] Status updates immediately after response
- [ ] Error messages display correctly
- [ ] Challenge expires after 48 hours
- [ ] Can see challenge history

---

## 🚀 Next Steps

1. **Integrate Hook** - Copy `useChallenges` into your project
2. **Build Components** - Create modal and challenge list components
3. **Test Endpoints** - Verify with sample data
4. **Wire Modal** - Add challenge button to user profiles
5. **Notifications** - Add toast/notifications for UX
6. **Quiz Integration** - Handle accepted challenges → start quiz
7. **Score Updates** - Backend will later update scores after quiz completion

---

**Backend Status:** ✅ Production Ready  
**API Version:** 1.0  
**Last Updated:** April 20, 2026

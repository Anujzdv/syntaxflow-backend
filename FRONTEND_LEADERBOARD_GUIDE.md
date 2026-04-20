# 🎮 Frontend Leaderboard Integration Guide

## Quick Start

The backend now provides a fully gamified leaderboard system. Here's what's ready for your frontend:

---

## 📍 API Endpoint

```
GET /api/leaderboard?type=global|weekly
Authorization: Bearer {JWT_TOKEN}
```

**Try it now:**
```bash
curl "YOUR_DEPLOYED_BACKEND/api/leaderboard?type=global" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📦 Response Structure

```json
{
  "topUsers": [
    {
      "_id": "60d5ec...",
      "name": "Anuj Kumar",
      "xp": 1250,
      "avgAccuracy": 92.5,
      "streak": 5,
      "avatar": "A",
      "rank": 1
    }
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

---

## 🎯 UI Implementation Map

| Frontend Component | Data Source | Notes |
|-------------------|------------|-------|
| **Podium (Top 3)** | `topUsers.slice(0, 3)` | Rank 1, 2, 3 only |
| **Leaderboard List (4+)** | `topUsers.slice(3)` | Remaining top 50 |
| **Sticky Current User Card** | `currentUser` | Always visible |
| **XP Progress Bar** | `currentUser.gapToNext / nextRankXp` | Show % to next rank |
| **Global/Weekly Tabs** | Query param `?type=` | Switch API call |

---

## 💻 React Code Example

```javascript
// hooks/useLeaderboard.js
import { useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = async (url) => {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
};

export const useLeaderboard = (type = 'global') => {
  const { data, error, isLoading } = useSWR(
    `/api/leaderboard?type=${type}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  return {
    topUsers: data?.topUsers || [],
    currentUser: data?.currentUser || null,
    isLoading,
    isError: !!error
  };
};

// Leaderboard.jsx
import { useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import Podium from './Podium';
import LeaderboardList from './LeaderboardList';
import CurrentUserCard from './CurrentUserCard';

export default function Leaderboard() {
  const [type, setType] = useState('global');
  const { topUsers, currentUser, isLoading } = useLeaderboard(type);

  if (isLoading) return <div>Loading leaderboard...</div>;

  return (
    <div className="leaderboard">
      {/* Filter Tabs */}
      <div className="tabs">
        <button 
          onClick={() => setType('global')}
          className={type === 'global' ? 'active' : ''}
        >
          🌍 Global
        </button>
        <button 
          onClick={() => setType('weekly')}
          className={type === 'weekly' ? 'active' : ''}
        >
          📅 Weekly
        </button>
      </div>

      {/* Podium (Top 3) */}
      <Podium users={topUsers.slice(0, 3)} />

      {/* Leaderboard List (4+) */}
      <LeaderboardList users={topUsers.slice(3)} />

      {/* Current User Sticky Card */}
      <CurrentUserCard 
        user={currentUser}
        nextRankXp={currentUser?.nextRankXp}
      />
    </div>
  );
}
```

---

## 🎨 Podium Component Example

```javascript
// Podium (positions 2, 1, 3)
const podiumOrder = [
  topUsers[1], // 🥈 Rank 2 - left
  topUsers[0], // 🥇 Rank 1 - center (tallest)
  topUsers[2]  // 🥉 Rank 3 - right
];

podiumOrder.map((user, i) => (
  <div key={user._id} className="podium-position">
    <img src={`/avatars/${user.avatar}`} />
    <h3>{user.name}</h3>
    <p>{user.xp} XP</p>
    {i === 1 && <span className="crown">👑</span>}
  </div>
))
```

---

## 🔄 Auto-Refresh Strategy

**On quiz completion:**
```javascript
// After user submits a quiz
await submitQuiz(answers);
// Refetch leaderboard to see updated rank
mutate('/api/leaderboard?type=' + currentType);
```

**Periodic refresh (optional):**
```javascript
// Refresh every 30 seconds
useSWR(
  `/api/leaderboard?type=${type}`,
  fetcher,
  { dedupingInterval: 30000 } // 30 seconds
);
```

---

## 🎯 Edge Cases to Handle

1. **User not in top 50:**
   - They'll still see `currentUser` data
   - Show their rank below the list

2. **User is Rank #1:**
   - `gapToNext = 0` (no one to beat)
   - Show "👑 You're #1!"

3. **User unranked (0 XP):**
   - `rank = "Unranked"`
   - Show "Complete your first quiz to join the leaderboard"

4. **Loading state:**
   - Show skeleton loaders for top 3
   - Show skeleton for list items

5. **Error state:**
   - Retry button
   - Fallback to old simple list (if you keep it)

---

## ✨ Gamification Features to Implement

| Feature | Component | Implementation |
|---------|-----------|-----------------|
| **Streak Badge** | Next to username | `🔥 5 streak` |
| **Rank Change Indicator** | Podium | Arrow ↑↓ animation |
| **XP Animation** | Current user card | Count-up animation |
| **Progress Bar** | Sticky card | Animated width: `gapToNext / nextRankXp` |
| **Click to Profile** | All user rows | Navigate to `/profile/{userId}` |
| **Challenge Button** | User rows | *Optional: Send challenge notification* |

---

## 🔧 Integration Checklist

- [ ] Add fetch call to `/api/leaderboard`
- [ ] Create `useLeaderboard` hook
- [ ] Build Podium UI component
- [ ] Build LeaderboardList component
- [ ] Build CurrentUserCard component (sticky)
- [ ] Add Global/Weekly filter tabs
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Handle edge cases (unranked, rank #1)
- [ ] Add animations (Framer Motion)
- [ ] Test on mobile responsiveness
- [ ] Add XP count-up animation
- [ ] Optional: Implement streak badges
- [ ] Optional: User profile linking

---

## 🚀 Ready to Deploy

The backend is **100% ready**. Start building the UI components!

**Questions?** Check `LEADERBOARD_API.md` for detailed endpoint documentation.

---

**Backend Version:** 1.0 ✅
**API Status:** Production Ready 🚀
**Last Updated:** April 20, 2026

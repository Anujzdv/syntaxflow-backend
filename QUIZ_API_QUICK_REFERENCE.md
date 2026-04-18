# 🚀 Quiz Engine API - Quick Reference Card

**Print this out or bookmark it!**

---

## 📋 Endpoint Cheat Sheet

### GET Quiz
```
GET /api/quizzes/:quizId
Header: Authorization: Bearer <token>
Response: 200 OK
```

### Submit Quiz  
```
POST /api/quizzes/:quizId/submit
Header: Authorization: Bearer <token>
Body: { answers: [...], timeTaken: 120, tabSwitchCount: 0 }
Response: 201 Created
```

---

## 🔑 Key Response Fields

| Field | Type | Where | Example |
|-------|------|-------|---------|
| `quiz.questions[].type` | String | GET /quizzes/:id | "single", "multi", "true_false" |
| `quiz.questions[].options[].text` | String | GET /quizzes/:id | "Option A" |
| `quiz.timeLimit` | Number | GET /quizzes/:id | 600 (seconds) |
| `result.score` | Number | POST /submit | 8 |
| `result.maxScore` | Number | POST /submit | 10 |
| `result.accuracy` | Number | POST /submit | 80 (percent) |
| `result.xpEarned` | Number | POST /submit | 120 |
| `result.passed` | Boolean | POST /submit | true |
| `result.flagged` | Boolean | POST /submit | false |
| `result.flagReason` | String | POST /submit | "Excessive tab switching" |

---

## ⚠️ Things That DON'T Exist

❌ `option.is_correct` — Don't try to access!  
❌ `question.explanation` — Not in response!  
❌ `quiz.correctAnswer` — Old field, doesn't exist!  

---

## 📝 Answer Format

```javascript
// What to send:
answers: [
  {
    questionId: "qId",
    selectedOptionIds: ["optId1"]      // Single
  },
  {
    questionId: "qId2",
    selectedOptionIds: ["optId1", "optId2"]  // Multi
  }
]
```

---

## 🎯 Question Types & UI

| Type | UI Component | Options | Example |
|------|---|---------|---------|
| `single` | Radio Buttons | 1 correct | "What is 2+2?" |
| `true_false` | Radio Buttons | 1 correct | "Is JavaScript async?" |
| `multi` | Checkboxes | Multiple correct | "Select all HOF methods: map□ filter□ sort□" |

---

## ⏱️ Fraud Detection Thresholds

| Metric | Threshold | Flag Reason |
|--------|-----------|-------------|
| `timeTaken` | < 20% of timeLimit | "Completed too quickly" |
| `tabSwitchCount` | > 5 | "Excessive tab switching detected" |

---

## 🏆 XP Calculation

```javascript
if (accuracy >= passingScore) {
  xpEarned = quiz.xp_reward * difficultyMultiplier * (accuracy / 100)
}

Multipliers:
- easy: 1x
- medium: 1.5x  
- hard: 2x

Example: quiz.xp_reward=100, difficulty=medium, accuracy=80%
xpEarned = 100 * 1.5 * 0.80 = 120 XP
```

---

## 🖼️ Component Checklist

```
QuizPage
 ✓ Timer with auto-submit
 ✓ Question counter (e.g., "Question 3 of 10")
 ✓ Question text display
 ✓ Code snippet (if exists)
 ✓ Options with radio/checkbox
 ✓ Submit button
 ✓ Error messages

ResultsPage
 ✓ Passed/Failed status
 ✓ Score (e.g., 8/10)
 ✓ Accuracy percentage
 ✓ XP earned
 ✓ Flagged warning (if applicable)
 ✓ Retake button
```

---

## 🔐 Security Checklist

- [ ] Send JWT in `Authorization: Bearer <token>`
- [ ] Never store correct answers client-side
- [ ] Track tab visibility changes
- [ ] Validate all form inputs before sending
- [ ] Handle 401 errors by redirecting to login
- [ ] Don't expose error details to users

---

## 🐛 Debugging Checklist

```javascript
// 1. Check request format
console.log(JSON.stringify(payload, null, 2));

// 2. Check response status
console.log(response.status); // Should be 201 on submit

// 3. Check token
console.log(token); // Should not be undefined

// 4. Check selectedOptionIds
console.log(selectedOptionIds); // Should be Array, not string

// 5. Check error from backend
console.log(response.text()); // See exact error message
```

---

## 📱 Copy-Paste Templates

### Fetch Quiz
```javascript
const response = await fetch(
  `https://syntaxflow-backend.onrender.com/api/quizzes/${quizId}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
const quiz = await response.json();
```

### Submit Quiz
```javascript
const response = await fetch(
  `https://syntaxflow-backend.onrender.com/api/quizzes/${quizId}/submit`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      answers: [
        { questionId: 'qId', selectedOptionIds: ['optId'] }
      ],
      timeTaken: 120,
      tabSwitchCount: 0
    })
  }
);
const result = await response.json();
```

---

## 🚨 Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Quiz fetched OK | Display quiz |
| 201 | Quiz submitted OK | Show results |
| 400 | Bad request | Check answer format |
| 401 | Not authenticated | Redirect to login |
| 404 | Quiz not found | Show error |
| 500 | Server error | Retry or show error |

---

## ✅ Pre-Launch Checklist

- [ ] Quiz loads without errors
- [ ] All question types render correctly
- [ ] Timer counts down and auto-submits
- [ ] Tab switch counter works
- [ ] Answers submit successfully
- [ ] Results display with correct format
- [ ] XP shows correctly
- [ ] Flagged warnings display (if testing with rapid tab switches)
- [ ] Error messages are user-friendly
- [ ] Loading states show (fetching quiz, submitting)
- [ ] Navigation works (back to dashboard, retake quiz)

---

**Need more help?** Read the full docs: `QUIZ_ENGINE_FRONTEND_INTEGRATION.md`

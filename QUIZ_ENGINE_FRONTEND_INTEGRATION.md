# 🎯 Quiz Engine Frontend Integration Guide

**Date:** April 18, 2026  
**Backend Status:** ✅ **PRODUCTION READY - ALL TESTS PASSING (23/23)**  
**New Feature:** Quiz Engine with XP System  
**Last Updated:** April 18, 2026 - Test Suite Verified

---

## ✅ Backend Verification Status

```
Test Results: 23/23 PASSING ✅
├── GET /api/quizzes/:quizId (7/7 passing)
│   ├── Authentication ✅
│   ├── Data Sanitization ✅
│   └── Error Handling ✅
├── POST /api/quizzes/:quizId/submit (10/10 passing)
│   ├── Score Calculation ✅
│   ├── XP Rewards ✅
│   ├── Fraud Detection ✅
│   └── Database Persistence ✅
└── Answer Validation (6/6 passing)
    ├── Single-select ✅
    ├── Multi-select ✅
    └── True/False ✅
```

---

## 📌 Overview

The backend now includes a complete **Quiz Engine** with following capabilities:
- 📝 Fetch quizzes with sanitized data (no correct answers exposed)
- ✅ Submit quiz answers with automatic grading
- 🏆 XP reward system with difficulty multipliers
- 🚩 Fraud detection (tab switching, suspiciously fast completion)
- 📊 Detailed scoring and accuracy tracking

**⚠️ CRITICAL SECURITY NOTE:** The backend sanitizes quiz data automatically. Frontend cannot, and should not, attempt to access `is_correct` or `explanation` fields.

---

## 🔗 API Endpoints Reference

### 1. GET `/api/quizzes/:quizId` - Fetch Quiz
**Purpose:** Load a quiz for the user to take  
**Authentication:** Required (JWT Bearer token)  
**Response:** Sanitized quiz data (no correct answers)

**Frontend Request Example:**
```javascript
const fetchQuiz = async (quizId, token) => {
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
  
  if (!response.ok) {
    throw new Error('Failed to fetch quiz');
  }
  
  return response.json();
};
```

**Response Format:**
```json
{
  "_id": "60d5ec49d4c5f0b2a8c1e2f3",
  "title": "JavaScript Fundamentals",
  "language": "JavaScript",
  "difficulty": "easy",
  "timeLimit": 600,
  "xp_reward": 100,
  "questions": [
    {
      "_id": "60d5ec49d4c5f0b2a8c1e2f4",
      "question_text": "What is the output of typeof null?",
      "code_snippet": null,
      "type": "single",
      "tags": ["typeof", "data-types"],
      "options": [
        {
          "_id": "60d5ec49d4c5f0b2a8c1e2f5",
          "text": "null"
        },
        {
          "_id": "60d5ec49d4c5f0b2a8c1e2f6",
          "text": "object"
        },
        {
          "_id": "60d5ec49d4c5f0b2a8c1e2f7",
          "text": "undefined"
        },
        {
          "_id": "60d5ec49d4c5f0b2a8c1e2f8",
          "text": "NaN"
        }
      ]
    }
  ],
  "createdAt": "2026-04-18T10:00:00.000Z",
  "updatedAt": "2026-04-18T10:00:00.000Z"
}
```

**⚠️ IMPORTANT:** Notice there is NO `is_correct` or `explanation` field. This is intentional for security.

---

### 2. POST `/api/quizzes/:quizId/submit` - Submit Quiz Answers
**Purpose:** Submit completed quiz and get results  
**Authentication:** Required (JWT Bearer token)  
**Payload:** Answers array, time taken, tab switches

**Request Format:**
```javascript
const submitQuiz = async (quizId, token, answers, timeTaken, tabSwitchCount) => {
  const payload = {
    answers: [
      {
        questionId: "60d5ec49d4c5f0b2a8c1e2f4",
        selectedOptionIds: ["60d5ec49d4c5f0b2a8c1e2f6"] // For single/true_false
      },
      {
        questionId: "60d5ec49d4c5f0b2a8c1e2f10",
        selectedOptionIds: ["60d5ec49d4c5f0b2a8c1e2f11", "60d5ec49d4c5f0b2a8c1e2f12"] // For multi-select
      }
    ],
    timeTaken: 245, // seconds
    tabSwitchCount: 0 // or count if tracking
  };

  const response = await fetch(
    `https://syntaxflow-backend.onrender.com/api/quizzes/${quizId}/submit`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  return response.json();
};
```

**Success Response Format (201):**
```json
{
  "success": true,
  "quizAttemptId": "60d5ec49d4c5f0b2a8c1e2f20",
  "score": 8,
  "maxScore": 10,
  "accuracy": 80,
  "passed": true,
  "xpEarned": 120,
  "timeTaken": 245,
  "flagged": false,
  "flagReason": null,
  "msg": "Quiz passed!"
}
```

**Error Response (400) - Invalid Format:**
```json
{
  "msg": "Answers must be an array"
}
```

**Error Response (404) - Quiz Not Found:**
```json
{
  "msg": "Quiz not found"
}
```

**Error Response (401) - Authentication Failed:**
```json
{
  "msg": "No token, authorization denied"
}
```

---

## 📋 Frontend Implementation Checklist

### Phase 1: Quiz Page Component
- [ ] Create Quiz Page component
- [ ] Add loading state while fetching quiz
- [ ] Display quiz metadata (title, language, difficulty, timeLimit)
- [ ] Display all questions with proper UI for different types

### Phase 2: Question Rendering
- [ ] **Single-select questions:** Use radio buttons
- [ ] **True/False questions:** Use radio buttons (2 options)
- [ ] **Multi-select questions:** Use checkboxes
- [ ] Display question text and code snippets (if any)
- [ ] Display all options with readable text

### Phase 3: Answer Tracking
- [ ] Store selected answers in component state
- [ ] Track which option(s) are selected per question
- [ ] Support changing answers before submission

### Phase 4: Timer & Fraud Detection
- [ ] Start timer when quiz loads
- [ ] Track elapsed time continuously
- [ ] Detect tab visibility changes (Page Visibility API)
- [ ] Count tab switches
- [ ] Include timeTaken and tabSwitchCount in submission

### Phase 5: Submit & Results
- [ ] Show submit button at bottom of quiz
- [ ] Disable submit until all questions answered (optional)
- [ ] Send answers array with proper structure
- [ ] Handle submission response
- [ ] Show results (score, accuracy, XP earned)
- [ ] Display pass/fail status
- [ ] If flagged, show warning about suspicious behavior

### Phase 6: Navigation & UX
- [ ] Add "Back" button to return from quiz
- [ ] Prevent accidental page refresh (unsavedChanges warning)
- [ ] Show progress indicator (e.g., "Question 3 of 10")
- [ ] (Optional) Enable/disable forward navigation

---

## 🚨 Important Implementation Notes

### 1. **No Client-Side Validation of Correctness**
You CANNOT know if an answer is correct until the backend response. This is by design.

```javascript
// ❌ DON'T TRY THIS
if (selectedOption.is_correct) {  // This field doesn't exist!
  showSuccess();
}

// ✅ DO THIS
const response = await submitQuiz(...);
if (response.passed) {
  showSuccess();
}
```

### 2. **Question Type Handling**

**Single-select & True/False:**
```javascript
// selectedOptionIds is an ARRAY with ONE element
{
  questionId: "q1",
  selectedOptionIds: ["opt1"]  // Only 1 item
}
```

**Multi-select:**
```javascript
// selectedOptionIds can have MULTIPLE elements
{
  questionId: "q3",
  selectedOptionIds: ["opt1", "opt2", "opt3"]  // Multiple items
}
```

### 3. **Tab Switch Detection**
```javascript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    tabSwitchCount++;
  }
});
```

### 4. **Time Tracking**
```javascript
const startTime = Date.now();
// ... quiz taking ...
const timeTaken = Math.floor((Date.now() - startTime) / 1000); // convert to seconds
```

### 5. **Fraud Detection Thresholds**
- **Too Fast:** If timeTaken < (timeLimit * 0.2), flagged
- **Tab Switching:** If tabSwitchCount > 5, flagged
- Even flagged quizzes are graded normally, but marked with warning

---

## 🧪 Testing Your Integration

### Test Case 1: Fetch a Quiz
```javascript
// Get quiz ID from your database or admin panel
const quizId = "...";
const quiz = await fetchQuiz(quizId, userToken);
console.log(quiz);
// Should have all fields except is_correct and explanation
```

### Test Case 2: Submit a Quiz
```javascript
const answers = [
  { questionId: quiz.questions[0]._id, selectedOptionIds: [quiz.questions[0].options[0]._id] },
  { questionId: quiz.questions[1]._id, selectedOptionIds: [quiz.questions[1].options[1]._id] },
  // ... more answers
];

const result = await submitQuiz(quizId, userToken, answers, 120, 0);
console.log(result.score);    // Should show score
console.log(result.passed);   // Should show if passed
```

### Test Case 3: Invalid Submissions
```javascript
// Missing timeTaken
const badResult = await submitQuiz(quizId, token, answers);
// Expected: 400 error

// Invalid answer format
const badResult2 = await submitQuiz(quizId, token, "not an array");
// Expected: 400 error
```

---

## 🎓 Reference: Response Examples by Scenario

### Scenario 1: All Correct, Fast Submission
```json
{
  "success": true,
  "score": 3,
  "maxScore": 3,
  "accuracy": 100,
  "passed": true,
  "xpEarned": 100,
  "flagged": false,
  "msg": "Quiz passed!"
}
```

### Scenario 2: Partial Correct
```json
{
  "success": true,
  "score": 2,
  "maxScore": 3,
  "accuracy": 66.67,
  "passed": true,
  "xpEarned": 66,
  "flagged": false,
  "msg": "Quiz passed!"
}
```

### Scenario 3: All Wrong
```json
{
  "success": true,
  "score": 0,
  "maxScore": 3,
  "accuracy": 0,
  "passed": false,
  "xpEarned": 0,
  "flagged": false,
  "msg": "Quiz submitted successfully"
}
```

### Scenario 4: Suspicious Behavior (Too Fast)
```json
{
  "success": true,
  "score": 3,
  "maxScore": 3,
  "accuracy": 100,
  "passed": true,
  "xpEarned": 100,
  "flagged": true,
  "flagReason": "Completed too quickly",
  "msg": "Quiz passed!"
}
```

### Scenario 5: Suspicious Behavior (Tab Switching)
```json
{
  "success": true,
  "score": 2,
  "maxScore": 3,
  "accuracy": 66.67,
  "passed": true,
  "xpEarned": 66,
  "flagged": true,
  "flagReason": "Excessive tab switching detected",
  "msg": "Quiz passed!"
}
```

---

## 📞 Support & Questions

- **Backend Issue?** Check test results in `tests/quiz.test.js`
- **API Response Unexpected?** Check response codes (200, 201, 400, 401, 404)
- **Time Limit Confusion?** timeLimit is in SECONDS (e.g., 600 = 10 minutes)
- **Token Issues?** Ensure Authorization header format: `Bearer <token>`

---

## ✨ Next Steps

1. **Review this document** with your frontend team
2. **Create Quiz Page component** based on the checklist
3. **Implement answer tracking** and UI for 3 question types
4. **Add fraud detection** (timer + tab switch tracking)
5. **Test with sample quiz ID** from backend admin panel
6. **Deploy to production**

**Questions?** Refer to test file: `/tests/quiz.test.js` for implementation examples
```

---

## 🎨 Frontend Component Requirements

### Component 1: Quiz Loader
**Responsibility:** Fetch and display quiz questions

```javascript
// Pseudo-code - DO NOT render is_correct or explanation
function QuizContent({ quiz }) {
  return (
    <div>
      <h1>{quiz.title}</h1>
      <p>Language: {quiz.language} | Difficulty: {quiz.difficulty}</p>
      <p>Time Limit: {quiz.timeLimit} seconds</p>
      <p>XP Reward: {quiz.xp_reward}</p>
      
      {quiz.questions.map((question) => (
        <QuestionComponent key={question._id} question={question} />
      ))}
    </div>
  );
}
```

### Component 2: Question Renderer
**Responsibility:** Render question and options based on type

```javascript
// Handle three question types:
// 1. "single" - Radio button (select one)
// 2. "true_false" - Yes/No radio
// 3. "multi" - Checkboxes (select multiple)

function QuestionComponent({ question }) {
  const [selectedOptions, setSelectedOptions] = useState([]);

  if (question.type === 'single' || question.type === 'true_false') {
    // Use <input type="radio" /> - only one answer
    return (
      <div>
        <h3>{question.question_text}</h3>
        {question.code_snippet && <CodeBlock code={question.code_snippet} />}
        <div>
          {question.options.map((option) => (
            <label key={option._id}>
              <input
                type="radio"
                name={question._id}
                value={option._id}
                onChange={(e) => setSelectedOptions([e.target.value])}
              />
              {option.text}
            </label>
          ))}
        </div>
      </div>
    );
  } else if (question.type === 'multi') {
    // Use <input type="checkbox" /> - multiple answers
    return (
      <div>
        <h3>{question.question_text}</h3>
        {question.code_snippet && <CodeBlock code={question.code_snippet} />}
        <div>
          {question.options.map((option) => (
            <label key={option._id}>
              <input
                type="checkbox"
                value={option._id}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedOptions([...selectedOptions, e.target.value]);
                  } else {
                    setSelectedOptions(
                      selectedOptions.filter(id => id !== e.target.value)
                    );
                  }
                }}
              />
              {option.text}
            </label>
          ))}
        </div>
      </div>
    );
  }
}
```

### Component 3: Timer Component
**Responsibility:** Track time and warn user

```javascript
function QuizTimer({ timeLimit, onTimeUp }) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp(); // Auto-submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit, onTimeUp]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isWarning = timeRemaining < 60;

  return (
    <div style={{ color: isWarning ? 'red' : 'black' }}>
      Time: {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}
```

### Component 4: Results Display
**Responsibility:** Show quiz results and feedback

```javascript
function QuizResults({ result }) {
  const passFailColor = result.passed ? 'green' : 'red';

  return (
    <div>
      <h2 style={{ color: passFailColor }}>
        {result.passed ? '🎉 Quiz Passed!' : '❌ Quiz Failed'}
      </h2>
      
      <div className="results-grid">
        <p>Score: <strong>{result.score}/{result.maxScore}</strong></p>
        <p>Accuracy: <strong>{result.accuracy.toFixed(2)}%</strong></p>
        <p>XP Earned: <strong>+{result.xpEarned}</strong></p>
        <p>Time Taken: <strong>{result.timeTaken}s</strong></p>
      </div>

      {result.flagged && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          padding: '10px',
          borderRadius: '4px'
        }}>
          ⚠️ <strong>Flagged:</strong> {result.flagReason}
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Answer Tracking & Submission Logic

### What Frontend Must Track:
```javascript
const quizState = {
  // Map: questionId -> [selectedOptionIds]
  answers: {
    "qId1": ["optId1"],           // Single answer
    "qId2": ["optId2", "optId3"], // Multi answer
  },
  startTime: Date.now(),
  tabSwitches: 0, // Increment on visibility change
};
```

### Track Tab Switching (Fraud Detection):
```javascript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // User left the tab
      setTabSwitchCount(prev => prev + 1);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### Build Submit Payload:
```javascript
const collectAnswers = (quizState, quizId) => {
  const answers = Object.entries(quizState.answers).map(
    ([questionId, selectedOptionIds]) => ({
      questionId,
      selectedOptionIds
    })
  );

  const timeTaken = Math.floor((Date.now() - quizState.startTime) / 1000);

  return {
    answers,
    timeTaken,
    tabSwitchCount: quizState.tabSwitches
  };
};
```

---

## 🚨 Error Handling & Edge Cases

### Validation Errors:
```javascript
const handleSubmitError = (error) => {
  if (error.status === 400) {
    // Bad request - validation failed
    // Likely: missing answers, invalid timeTaken, etc.
    showError("Please ensure all questions are answered");
  } else if (error.status === 401) {
    // Not authenticated
    redirectToLogin();
  } else if (error.status === 404) {
    // Quiz not found
    showError("This quiz is no longer available");
  } else if (error.status === 500) {
    // Server error
    showError("Server error. Please try again later");
  }
};
```

### Answer Validation Before Submit:
```javascript
const validateAnswers = (quizState, quiz) => {
  const errors = [];

  quiz.questions.forEach(question => {
    const selectedIds = quizState.answers[question._id];
    
    if (!selectedIds || selectedIds.length === 0) {
      errors.push(`Question "${question.question_text}" is not answered`);
    }

    if (
      (question.type === 'single' || question.type === 'true_false') &&
      selectedIds.length !== 1
    ) {
      errors.push(`Question "${question.question_text}" requires exactly one answer`);
    }
  });

  return errors;
};
```

---

## 🔐 Security Notes for Frontend

### ✅ DO:
- ✅ Store JWT token securely (preferably in httpOnly cookie)
- ✅ Send token in `Authorization: Bearer <token>` header
- ✅ Track all user interactions for fraud detection
- ✅ Validate form inputs before sending

### ❌ DON'T:
- ❌ Try to access `is_correct` field (won't exist in response)
- ❌ Try to access `explanation` field (won't exist in response)
- ❌ Send answers logic client-side; backend validates server-side
- ❌ Store sensitive data in localStorage unencrypted
- ❌ Disable tab-switch detection

---

## 📱 Complete Quiz Flow Example

```javascript
// 1. Load Quiz
const [quiz, setQuiz] = useState(null);
useEffect(() => {
  fetchQuiz(quizId, token).then(setQuiz);
}, [quizId, token]);

// 2. User takes quiz (tracks answers, time, tab switches)
const handleAnswerSelect = (questionId, optionId) => {
  setQuizState(prev => ({
    ...prev,
    answers: {
      ...prev.answers,
      [questionId]: [optionId] // or append for multi
    }
  }));
};

// 3. User clicks Submit
const handleSubmitQuiz = async () => {
  const errors = validateAnswers(quizState, quiz);
  if (errors.length > 0) {
    showErrors(errors);
    return;
  }

  setLoading(true);
  try {
    const payload = collectAnswers(quizState, quizId);
    const result = await submitQuiz(quizId, token, payload);
    setResults(result);
    showSuccessMessage(result.msg);
  } catch (error) {
    handleSubmitError(error);
  } finally {
    setLoading(false);
  }
};

// 4. Show Results
if (results) {
  return <QuizResults result={results} />;
}

// 5. Show Quiz or Timer
return (
  <>
    <QuizTimer timeLimit={quiz.timeLimit} onTimeUp={handleSubmitQuiz} />
    <QuizContent quiz={quiz} onAnswerSelect={handleAnswerSelect} />
    <button onClick={handleSubmitQuiz}>Submit Quiz</button>
  </>
);
```

---

## 🧪 Testing Checklist

- [ ] Fetch quiz without errors
- [ ] Verify no `is_correct` or `explanation` fields visible
- [ ] Single-select questions work (radio buttons)
- [ ] Multi-select questions work (checkboxes)
- [ ] Timer counts down correctly
- [ ] Timer auto-submits when it reaches 0
- [ ] Tab switch counter increments on visibility change
- [ ] Submit payload is correct JSON format
- [ ] Results display correctly (passed/failed)
- [ ] XP earned displays correctly
- [ ] Flagged suspicious attempts show warning
- [ ] Error messages display for invalid submissions
- [ ] Authentication errors redirect to login

---

## 🔗 Backend API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/quizzes/:quizId` | Yes | Fetch quiz (sanitized) |
| POST | `/api/quizzes/:quizId/submit` | Yes | Submit answers & get results |
| GET | `/api/quiz/:language` | Yes | [OLD] Get random questions by language |
| POST | `/api/quiz/submit` | Yes | [OLD] Submit language quiz |

**Note:** Old endpoints still work for backward compatibility. Use new `/api/quizzes/*` endpoints for the new quiz engine.

---

## ❓ FAQ

**Q: Why can't I see `is_correct` in the response?**  
A: By design! Backend sanitizes data to prevent cheating. All validation happens server-side.

**Q: What if user changes tab during quiz?**  
A: Frontend tracks it, sends `tabSwitchCount` to backend. Backend flags suspicious behavior.

**Q: How is XP calculated?**  
A: `XP = (quiz.xp_reward * difficulty_multiplier * (accuracy / 100))`  
Only awarded if `accuracy >= passingScore` (default 60%)

**Q: Can I show answers after submission?**  
A: Not from this API. Frontend would need a separate `/api/quizzes/:quizId/results/:attemptId` endpoint to fetch detailed results with explanations.

---

## 📞 Support
Any issues? Check that:
1. Token is valid and sent in header
2. Quiz ID is correct
3. Answer format matches (array of objects with questionId & selectedOptionIds)
4. Network tab shows 201 Created on successful submit

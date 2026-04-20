# 📋 FRONTEND DEBUGGING PROMPT - Submit Button Not Working

## ✅ Backend Status

The backend submit endpoint is **WORKING CORRECTLY**:
- ✅ Routes exist at both `/api/quiz/javascript/submit` and `/api/quizzes/javascript/submit`
- ✅ Returns 401 "No token, authorization denied" when no auth header is sent
- ✅ This is EXPECTED behavior - authentication required for quiz submission

## ❌ Problem Identified

The submit button is not working because:
1. **Frontend is not sending Auth Token** OR
2. **User is not logged in** OR  
3. **Request headers are malformed**

## 🔍 Frontend Debugging Steps

### Step 1: Verify User is Logged In
```
1. Open the app
2. Check if you see a logged-in username/profile
3. If NOT logged in → Login first, then try quiz
4. If logged in → Continue to Step 2
```

### Step 2: Check Network Request Headers
```
1. Open browser DevTools (F12 or Ctrl+Shift+I)
2. Go to "Network" tab
3. Click submit button on quiz
4. Look for the POST request to /api/quiz/javascript/submit
5. Click on the request
6. Go to "Request Headers" section
7. Look for: Authorization: Bearer <long_token_string>
```

**Expected to see:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Step 3: Check Response Status
```
In DevTools Network tab:
- If Status is 401: Auth header is missing or invalid ❌
- If Status is 201: Success! Score saved ✅
- If Status is 400: Bad request payload ❌
- If Status is 500: Server error ❌
```

### Step 4: Check Browser Console
```
1. Go to "Console" tab in DevTools
2. Look for JavaScript errors
3. Common errors might be:
   - "Unauthorized" - no token
   - "Network error" - CORS issue
   - "SyntaxError" - malformed JSON
```

## 🐛 Common Issues and Fixes

### Issue 1: User Not Logged In
**Symptoms:** 401 error, "No token, authorization denied"
**Fix:** 
```
1. Go to login page
2. Enter credentials
3. Verify "Login successful" message
4. Try quiz submit again
```

### Issue 2: Token Not Sent in Request
**Symptoms:** 401 error, missing "Authorization" header
**Fix - Check your fetch/axios code:**
```javascript
// ❌ WRONG - No Authorization header
fetch('/api/quiz/javascript/submit', {
  method: 'POST',
  body: JSON.stringify(data)
})

// ✅ CORRECT - With Authorization header
const token = localStorage.getItem('token'); // or sessionStorage
fetch('/api/quiz/javascript/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // ← ADD THIS
  },
  body: JSON.stringify(data)
})
```

Or with Axios:
```javascript
// ✅ CORRECT - With auth header in config
const token = localStorage.getItem('token');
axios.post('/api/quiz/javascript/submit', data, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Issue 3: CORS Error
**Symptoms:** "Access to XMLHttpRequest blocked by CORS policy"
**Fix:** Backend CORS is already configured, but:
- Check that frontend URL is in allowed origins
- Make sure cookies are being sent if needed:
  ```javascript
  fetch(url, {
    method: 'POST',
    credentials: 'include',  // Include cookies
    headers: { 'Authorization': `Bearer ${token}` }
  })
  ```

### Issue 4: Incorrect Request Payload
**Symptoms:** 400 error, "Answers must be an array"
**Fix - Ensure payload format is correct:**
```javascript
// ✅ CORRECT format
{
  answers: [
    {
      questionId: "q1",  // Must be the question ID from quiz
      selectedOptionIds: ["o2"]  // Array of selected option IDs
    },
    {
      questionId: "q2",
      selectedOptionIds: ["o1"]
    }
  ],
  timeTaken: 120,  // Seconds - must be number
  tabSwitchCount: 0  // Optional
}
```

## 📊 Expected Response After Submit

**Status: 201 Created**
```json
{
  "success": true,
  "quizAttemptId": "attempt_id_123",
  "score": 2,
  "maxScore": 3,
  "accuracy": 66.67,
  "passed": false,
  "xpEarned": 0,
  "timeTaken": 120,
  "flagged": false,
  "flagReason": null,
  "msg": "Quiz submitted successfully"
}
```

## 🧪 Test the Request Manually

You can test the submit endpoint manually to verify it's working:

```bash
# 1. Get a token (after login)
TOKEN="<paste-your-jwt-token-here>"

# 2. Submit quiz
curl -X POST https://syntaxflow-backend.onrender.com/api/quiz/javascript/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"questionId": "q1", "selectedOptionIds": ["o2"]}
    ],
    "timeTaken": 60,
    "tabSwitchCount": 0
  }'
```

**Expected response:** 201 with score data (not 401)

## 📋 Debugging Checklist

- [ ] User is logged in (see username in UI)
- [ ] Browser Console has no JavaScript errors
- [ ] Network tab shows POST request to /api/quiz/javascript/submit
- [ ] Request Headers include "Authorization: Bearer <token>"
- [ ] Response Status is 201 (not 401, 400, 500)
- [ ] Response body contains score data
- [ ] Score displays on results page

## ✅ If Everything Checks Out

If all the above are true but submit still isn't working:

1. **Check localStorage/sessionStorage:**
   ```javascript
   // In browser console
   console.log(localStorage.getItem('token'))
   console.log(localStorage.getItem('authToken'))  // Different name?
   ```

2. **Check if token is being cleared:**
   - After login, is the page reloading and clearing storage?
   - Is there session timeout logic removing the token?

3. **Check quiz data structure:**
   - Are question IDs correct?
   - Are option IDs correct?
   - Are they being passed to the submit function?

## 🆘 Still Not Working?

Provide this information:

1. **Screenshot of DevTools Network tab** showing the POST request and response
2. **Browser Console errors** (copy full error message)
3. **Token value** (first 20 characters): `eyJhbGciOi...`
4. **Quiz data** you're sending (answers array format)
5. **Response status code** and body

---

**Bottom Line**: Submit endpoint is working. The issue is almost certainly that the frontend isn't sending the Authorization header with a valid JWT token. Check DevTools Network tab and verify the token is being sent.

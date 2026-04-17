# Snippets API - Global Feed Feature Documentation

## Overview
The backend is now fully updated to support an Instagram-style global feed with code snippets. Frontend can create, view, like, and comment on snippets from any programming language.

---

## 📋 Supported Languages
The following languages are now supported for code snippets:
- `c`
- `cpp`
- `java`
- `html`
- `python`

**Note:** Language values must be in **lowercase**.

---

## 🔌 API Endpoints

### 1️⃣ Create a Snippet
**Endpoint:** `POST /api/snippets`  
**Authentication:** Required (JWT token in Authorization header)  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "code": "print('Hello, World!')",
  "language": "python",
  "title": "My First Python Program",      // ← Optional (default: "Untitled Snippet")
  "description": "A simple hello world"    // ← Optional (default: "")
}
```

**Required Fields:**
- `code` (string) - The actual code snippet
- `language` (string) - One of: `c`, `cpp`, `java`, `html`, `python`

**Success Response (201 Created):**
```json
{
  "_id": "snippet-id-123",
  "code": "print('Hello, World!')",
  "language": "python",
  "title": "My First Python Program",
  "description": "A simple hello world",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "profileImage": "url-to-image.png"
  },
  "likes": [],
  "comments": [],
  "createdAt": "2026-04-17T10:00:00.000Z",
  "updatedAt": "2026-04-17T10:00:00.000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "msg": "Language \"javascript\" is not supported. Allowed languages: c, cpp, java, html, python"
}
```

---

### 2️⃣ Get Global Feed (All Snippets)
**Endpoint:** `GET /api/snippets`  
**Authentication:** Not required (Public)  
**Method:** GET

**Query Parameters:** None (returns all snippets)

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "snippet-id-123",
      "code": "print('Hello')",
      "language": "python",
      "title": "Hello World",
      "description": "First program",
      "user": {
        "_id": "user-id",
        "name": "John Doe",
        "profileImage": "url-to-image.png"
      },
      "likes": [
        { "user": "user-id-2" },
        { "user": "user-id-3" }
      ],
      "comments": [
        {
          "user": "user-id-2",
          "name": "Jane Doe",
          "text": "Great snippet!",
          "date": "2026-04-17T10:05:00.000Z"
        }
      ],
      "createdAt": "2026-04-17T10:00:00.000Z",
      "updatedAt": "2026-04-17T10:05:00.000Z"
    }
    // ... more snippets sorted by newest first
  ]
}
```

**Features:**
- ✅ Snippets sorted by newest first (createdAt: -1)
- ✅ User information populated
- ✅ Likes array included
- ✅ Comments array included
- ✅ Public endpoint (no auth required)

---

### 3️⃣ Like/Unlike a Snippet
**Endpoint:** `POST /api/snippets/:id/like`  
**Authentication:** Required (JWT token)  
**Method:** POST

**URL Parameters:**
- `id` - The snippet ID

**Request Body:** Empty `{}`

**Success Response (200 OK):**
```json
{
  "msg": "Snippet liked",
  "likes": [
    { "user": "user-id-1" },
    { "user": "user-id-2" }
  ],
  "likesCount": 2
}
```

**When Unliking:**
```json
{
  "msg": "Snippet unliked",
  "likes": [
    { "user": "user-id-2" }
  ],
  "likesCount": 1
}
```

**Toggle Behavior:**
- First request: Likes the snippet
- Second request: Unlikes the snippet
- Uses same endpoint for both operations

---

### 4️⃣ Add Comment to Snippet
**Endpoint:** `POST /api/snippets/:id/comment`  
**Authentication:** Required (JWT token)  
**Method:** POST

**URL Parameters:**
- `id` - The snippet ID

**Request Body:**
```json
{
  "text": "This is a great snippet!"
}
```

**Required Fields:**
- `text` (string) - The comment text

**Success Response (200 OK):**
```json
{
  "msg": "Comment added successfully",
  "comments": [
    {
      "user": "user-id-1",
      "name": "John Doe",
      "text": "This is a great snippet!",
      "date": "2026-04-17T10:10:00.000Z"
    }
  ]
}
```

**Error Response (400 Bad Request):**
```json
{
  "msg": "Comment text is required"
}
```

---

### 5️⃣ Report a Snippet
**Endpoint:** `POST /api/snippets/:id/report`  
**Authentication:** Required (JWT token)  
**Method:** POST

**URL Parameters:**
- `id` - The snippet ID

**Request Body:**
```json
{
  "reason": "Inappropriate content"  // ← Optional (default: "Inappropriate content")
}
```

**Success Response (200 OK):**
```json
{
  "msg": "Snippet reported successfully",
  "reportCount": 3
}
```

**Error Response (400 Bad Request - Duplicate Report):**
```json
{
  "msg": "You have already reported this snippet"
}
```

---

## 🛡️ Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

The token is obtained from the login endpoint:
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response includes:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## ⚠️ Error Handling

### Common Error Responses

**401 Unauthorized (Missing/Invalid Token):**
```json
{
  "msg": "No token, authorization denied"
}
```

**400 Bad Request (Validation Error):**
```json
{
  "msg": "Language \"javascript\" is not supported. Allowed languages: c, cpp, java, html, python"
}
```

**404 Not Found:**
```json
{
  "msg": "Snippet not found"
}
```

**500 Server Error:**
```json
{
  "msg": "Server error while creating snippet"
}
```

---

## 📍 Testing Workflow

### 1. Create a Test Snippet
```bash
curl -X POST https://syntaxflow-backend.onrender.com/api/snippets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello\")",
    "language": "python",
    "title": "Test"
  }'
```

### 2. Fetch Global Feed
```bash
curl https://syntaxflow-backend.onrender.com/api/snippets
```

### 3. Like a Snippet
```bash
curl -X POST https://syntaxflow-backend.onrender.com/api/snippets/SNIPPET_ID/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Add Comment
```bash
curl -X POST https://syntaxflow-backend.onrender.com/api/snippets/SNIPPET_ID/comment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Great code!"}'
```

---

## ✅ Test Coverage

The backend has comprehensive test coverage:
- ✅ 26 snippet tests
- ✅ Tests for all 5 supported languages
- ✅ Tests for create, read, like, comment, report
- ✅ Tests for error cases (invalid language, missing fields, etc.)
- ✅ Tests for authentication requirements
- ✅ Integration tests for complete feed workflows

See `tests/snippets.test.js` for full test suite.

---

## 🚀 Frontend Integration Checklist

- [ ] Update API base URL to `https://syntaxflow-backend.onrender.com`
- [ ] Update snippet creation to accept lowercase language values
- [ ] Update snippet POST endpoint to handle optional title/description
- [ ] Update like endpoint from `PUT /like/:id` to `POST /:id/like`
- [ ] Update comment endpoint to `POST /:id/comment`
- [ ] Ensure JWT token is sent in Authorization header
- [ ] Handle error messages from API responses
- [ ] Populate user info when displaying snippets in feed
- [ ] Display likes count and allow users to toggle likes
- [ ] Display comments and allow users to add comments

---

## 📞 Support

For any issues with the backend API, check:
1. **Render Logs:** https://dashboard.render.com/web/srv-*** (check Instance Logs)
2. **GitHub:** https://github.com/Anujzdv/syntaxflow-backend
3. **Documentation:** This file

All feedback and issues can be reported in the GitHub repository.

---

**Last Updated:** April 17, 2026  
**Version:** 2.0 (Global Feed Feature)

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

### 2️⃣ Get Global Feed (All Snippets) - With Pagination
**Endpoint:** `GET /api/snippets`  
**Authentication:** Not required (Public)  
**Method:** GET

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

**Example Requests:**
```bash
# Get first page with 10 items (default)
GET /api/snippets

# Get page 2 with 5 items per page
GET /api/snippets?page=2&limit=5

# Infinite scroll - keep incrementing page and limit
GET /api/snippets?page=1&limit=20
GET /api/snippets?page=2&limit=20
GET /api/snippets?page=3&limit=20
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 10,
  "totalSnippets": 150,
  "totalPages": 15,
  "currentPage": 1,
  "hasMore": true,
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
        // ... Up to 3 comments (see totalComments for full count)
      ],
      "totalComments": 8,
      "showMoreComments": true,
      "createdAt": "2026-04-17T10:00:00.000Z",
      "updatedAt": "2026-04-17T10:05:00.000Z"
    }
    // ... more snippets
  ]
}
```

**Key Features for Infinite Scroll:**
- ✅ `hasMore: true/false` - Tell frontend when to Stop requesting
- ✅ `totalPages` - Total number of pages available
- ✅ `totalSnippets` - Total number of snippets in database
- ✅ `totalComments` - Shows actual comment count (for "View X more comments" feature)
- ✅ `showMoreComments` - Flag if comments are limited to 3 in feed
- ✅ Comments limited to 3 per snippet in feed for performance
- ✅ Newest first (createdAt: -1)

**Error Response (400 Bad Request):**
```json
{
  "msg": "Page must be greater than 0"
}
```
or
```json
{
  "msg": "Limit must be between 1 and 100"
}
```

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

### 4️⃣ Get Comments for a Snippet (Pagination)
**Endpoint:** `GET /api/snippets/:id/comments`  
**Authentication:** Not required (Public)  
**Method:** GET

**URL Parameters:**
- `id` - The snippet ID

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Comments per page (default: 10, max: 100)

**Example Requests:**
```bash
# Get first page of comments (default 10 per page)
GET /api/snippets/SNIPPET_ID/comments

# Get page 2 with 5 comments per page
GET /api/snippets/SNIPPET_ID/comments?page=2&limit=5
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 10,
  "totalComments": 45,
  "totalPages": 5,
  "currentPage": 1,
  "hasMore": true,
  "data": [
    {
      "user": "user-id-1",
      "name": "John Doe",
      "text": "This is amazing!",
      "date": "2026-04-17T10:10:00.000Z"
    },
    {
      "user": "user-id-2",
      "name": "Jane Smith",
      "text": "Great code!",
      "date": "2026-04-17T10:05:00.000Z"
    }
    // ... more comments
  ]
}
```

**Key Features:**
- ✅ Paginated comments for viewing all feedback
- ✅ `hasMore` flag for infinite scroll
- ✅ Shows when feed limits comments to 3, use this endpoint to load rest
- ✅ Most recent comments first
- ✅ Public endpoint (no auth required)

**Error Response (404 Not Found):**
```json
{
  "msg": "Snippet not found"
}
```

---

### 5️⃣ Add Comment to Snippet
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

### 6️⃣ Report a Snippet
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

### 1. Create Multiple Test Snippets
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

### 2. Fetch Global Feed with Pagination
```bash
# Get first page (10 items)
curl https://syntaxflow-backend.onrender.com/api/snippets

# Get page 2 with custom limit
curl https://syntaxflow-backend.onrender.com/api/snippets?page=2&limit=5

# Check hasMore flag for infinite scroll
curl https://syntaxflow-backend.onrender.com/api/snippets?page=100&limit=10
```

### 3. Test Comment Pagination
```bash
# Get first page of comments for snippet
curl https://syntaxflow-backend.onrender.com/api/snippets/SNIPPET_ID/comments

# Get specific page
curl https://syntaxflow-backend.onrender.com/api/snippets/SNIPPET_ID/comments?page=2&limit=5
```

### 4. Like a Snippet
```bash
curl -X POST https://syntaxflow-backend.onrender.com/api/snippets/SNIPPET_ID/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Add Comments
```bash
curl -X POST https://syntaxflow-backend.onrender.com/api/snippets/SNIPPET_ID/comment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Great code!"}'
```

---

## ✅ Test Coverage

The backend has comprehensive test coverage with **60 tests** total:
- ✅ 15 authentication tests
- ✅ 26 snippets feature tests
- ✅ **19 pagination & infinite scroll tests**
  - Pagination parameter validation
  - Default values
  - Edge cases (last page, invalid parameters)
  - Comment pagination
  - Comment limiting in feed (max 3)
  - hasMore flag verification

See `tests/auth.test.js` and `tests/snippets.test.js` for full test suites.

---

## 🚀 Frontend Integration Checklist

### Core Features
- [ ] Update API base URL to `https://syntaxflow-backend.onrender.com`
- [ ] Update snippet creation to accept lowercase language values
- [ ] Update snippet POST endpoint to handle optional title/description
- [ ] Ensure JWT token is sent in Authorization header
- [ ] Handle error messages from API responses

### Pagination & Infinite Scroll
- [ ] Implement IntersectionObserver for infinite scroll
- [ ] Use `page` and `limit` query parameters
- [ ] Check `hasMore` flag to know when to stop loading
- [ ] Display `totalSnippets` as "X snippets" counter
- [ ] Load next page when user scrolls to bottom
- [ ] Display loading indicator while fetching
- [ ] Handle loading errors gracefully

### Feed Display
- [ ] Populate user info when displaying snippets (name, profileImage)
- [ ] Display likes count and allow users to toggle likes
- [ ] Display `totalComments` count
- [ ] Show first 3 comments in feed
- [ ] Show "View X more comments" button if `showMoreComments === true`
- [ ] Handle comment pagination on comment detail view

### Reel-Style Features
- [ ] Use full-screen snap-scroll layout
- [ ] One snippet per viewport
- [ ] Auto-play/like/comment without leaving feed
- [ ] Swipe to next snippet
- [ ] Limit comments display for smooth scrolling

---

## � Frontend: Infinite Scroll Example

Here's a React example using IntersectionObserver for infinite scroll:

```javascript
import { useEffect, useRef, useState } from 'react';

function ReelsFeed() {
  const [snippets, setSnippets] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef(null);

  const fetchSnippets = async (pageNum) => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const res = await fetch(
        `https://syntaxflow-backend.onrender.com/api/snippets?page=${pageNum}&limit=10`
      );
      const data = await res.json();
      
      setSnippets(prev => [...prev, ...data.data]);
      setHasMore(data.hasMore);
      setPage(pageNum + 1);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use IntersectionObserver for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchSnippets(page);
      }
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  // Initial load
  useEffect(() => {
    fetchSnippets(1);
  }, []);

  return (
    <div className="reels-feed">
      {snippets.map(snippet => (
        <div key={snippet._id} className="reel">
          {/* Snippet content */}
        </div>
      ))}
      
      {/* Intersection observer target */}
      <div ref={observerTarget} />
      
      {loading && <p>Loading more snippets...</p>}
    </div>
  );
}
```

---

## �📞 Support

For any issues with the backend API, check:
1. **Render Logs:** https://dashboard.render.com/web/srv-*** (check Instance Logs)
2. **GitHub:** https://github.com/Anujzdv/syntaxflow-backend
3. **Documentation:** This file

All feedback and issues can be reported in the GitHub repository.

---

**Last Updated:** April 17, 2026  
**Version:** 2.1 (Pagination & Infinite Scroll)

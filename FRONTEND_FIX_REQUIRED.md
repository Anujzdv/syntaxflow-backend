# Frontend Registration Fix Required

## Issue
Registration requests are returning **400 Bad Request** from the backend API.

## Root Cause
The frontend is sending the wrong field name to the backend.

**Current (WRONG):**
```json
{
  "username": "test123",
  "email": "test@gmail.com",
  "password": "Password123"
}
```

**Expected (CORRECT):**
```json
{
  "name": "test123",
  "email": "test@gmail.com",
  "password": "Password123"
}
```

## What to Fix

### 1. Update the Register Component/Page
Find where you handle the registration form submission and change:
- `username` → `name`

### 2. Code Example - Before:
```javascript
const handleRegister = async (formData) => {
  const { username, email, password } = formData;
  
  const response = await fetch('https://syntaxflow-backend.onrender.com/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
};
```

### 3. Code Example - After:
```javascript
const handleRegister = async (formData) => {
  const { name, email, password } = formData;  // ← Changed "username" to "name"
  
  const response = await fetch('https://syntaxflow-backend.onrender.com/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })  // ← Now sending "name"
  });
};
```

## Backend API Expectations

### Register Endpoint
- **URL:** `/api/auth/register`
- **Method:** POST
- **Required Fields:**
  - `name` (string) - User's full name
  - `email` (string) - Valid email address
  - `password` (string) - Min 6 characters

### Login Endpoint
- **URL:** `/api/auth/login`
- **Method:** POST
- **Required Fields:**
  - `email` (string)
  - `password` (string)

### Get Profile Endpoint
- **URL:** `/api/auth/me`
- **Method:** GET
- **Headers:** `Authorization: Bearer <token>`

## Testing Steps
1. Update frontend code to send `name` instead of `username`
2. Try registering again with test user
3. Expected result: User created successfully, display success message
4. Verify user can then login with same credentials

## Questions?
Contact backend team or check [Backend API Documentation](./API_DOCS.md)

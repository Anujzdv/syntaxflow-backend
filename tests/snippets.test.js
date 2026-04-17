require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const Snippet = require('../models/Snippet');

describe('Snippets API Tests - Global Feed Feature', () => {

  let token;
  let userId;
  let snippetId;

  beforeEach(async () => {
    // Register and login user for protected routes
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123'
      });

    token = loginRes.body.token;
    
    // Get user ID from token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.user.id;
  });

  // ==========================================
  // TEST 1: CREATE SNIPPETS WITH NEW LANGUAGES
  // ==========================================
  describe('POST /api/snippets - Create Snippet', () => {

    test('Should create a snippet with language "python"', async () => {
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Hello Python',
          description: 'A simple python program',
          code: 'print("Hello, World!")',
          language: 'python'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.code).toBe('print("Hello, World!")');
      expect(res.body.language).toBe('python');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Test User');
      snippetId = res.body._id;
    });

    test('Should create a snippet with language "c"', async () => {
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'int main() { return 0; }',
          language: 'c'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.language).toBe('c');
      expect(res.body.title).toBe('Untitled Snippet');
      expect(res.body.description).toBe('');
    });

    test('Should create a snippet with language "cpp"', async () => {
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: '#include <iostream>',
          language: 'cpp'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.language).toBe('cpp');
    });

    test('Should create a snippet with language "java"', async () => {
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'public class Main {}',
          language: 'java'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.language).toBe('java');
    });

    test('Should create a snippet with language "html"', async () => {
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: '<h1>Hello</h1>',
          language: 'html'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.language).toBe('html');
    });

    test('Should handle case-insensitive language input', async () => {
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'print("test")',
          language: 'PYTHON'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.language).toBe('python');
    });

    test('Should reject snippet with unsupported language', async () => {
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'code here',
          language: 'javascript'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('not supported');
    });

    test('Should reject snippet without language', async () => {
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'code here'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('required');
    });

    test('Should reject snippet without code', async () => {
      const res = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          language: 'python'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('required');
    });

    test('Should require authentication to create snippet', async () => {
      const res = await request(app)
        .post('/api/snippets')
        .send({
          code: 'code here',
          language: 'python'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  // ==========================================
  // TEST 2: GLOBAL FEED - GET ALL SNIPPETS
  // ==========================================
  describe('GET /api/snippets - Global Feed', () => {

    beforeEach(async () => {
      // Create test snippets
      await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Python Snippet',
          code: 'print("hello")',
          language: 'python'
        });

      await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'int i = 0;',
          language: 'c'
        });
    });

    test('Should get all snippets with user info populated', async () => {
      const res = await request(app)
        .get('/api/snippets');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(2);
      expect(res.body.data).toBeInstanceOf(Array);
      
      // Check first snippet has user info
      expect(res.body.data[0].user).toBeDefined();
      expect(res.body.data[0].user.name).toBeDefined();
      expect(res.body.data[0].user.profileImage).toBeDefined();
    });

    test('Should return snippets sorted by newest first', async () => {
      const res = await request(app)
        .get('/api/snippets');

      expect(res.statusCode).toBe(200);
      
      // Check if sorted by createdAt descending
      for (let i = 0; i < res.body.data.length - 1; i++) {
        const current = new Date(res.body.data[i].createdAt).getTime();
        const next = new Date(res.body.data[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    test('Should be accessible without authentication', async () => {
      const res = await request(app)
        .get('/api/snippets');

      expect(res.statusCode).toBe(200);
    });

    test('Should return empty array if no snippets exist', async () => {
      const res = await request(app)
        .get('/api/snippets');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ==========================================
  // TEST 3: LIKE FUNCTIONALITY
  // ==========================================
  describe('POST /api/snippets/:id/like - Like/Unlike Snippet', () => {

    beforeEach(async () => {
      // Create a snippet to like
      const createRes = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'test code',
          language: 'python'
        });

      snippetId = createRes.body._id;
    });

    test('Should like a snippet successfully', async () => {
      const res = await request(app)
        .post(`/api/snippets/${snippetId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toContain('liked');
      expect(res.body.likesCount).toBe(1);
      expect(res.body.likes).toBeInstanceOf(Array);
    });

    test('Should unlike a snippet (toggle)', async () => {
      // Like first
      await request(app)
        .post(`/api/snippets/${snippetId}/like`)
        .set('Authorization', `Bearer ${token}`);

      // Unlike
      const res = await request(app)
        .post(`/api/snippets/${snippetId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toContain('unliked');
      expect(res.body.likesCount).toBe(0);
    });

    test('Should return 404 for non-existent snippet', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post(`/api/snippets/${fakeId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.msg).toBe('Snippet not found');
    });

    test('Should require authentication to like', async () => {
      const res = await request(app)
        .post(`/api/snippets/${snippetId}/like`);

      expect(res.statusCode).toBe(401);
    });

    test('Should handle multiple users liking same snippet', async () => {
      // User 1 likes
      await request(app)
        .post(`/api/snippets/${snippetId}/like`)
        .set('Authorization', `Bearer ${token}`);

      // Create and login second user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User Two',
          email: 'user2@test.com',
          password: 'password123'
        });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user2@test.com',
          password: 'password123'
        });

      const token2 = loginRes.body.token;

      // User 2 likes
      const res = await request(app)
        .post(`/api/snippets/${snippetId}/like`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.likesCount).toBe(2);
    });
  });

  // ==========================================
  // TEST 4: COMMENT ON SNIPPETS
  // ==========================================
  describe('POST /api/snippets/:id/comment - Add Comments', () => {

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'test code',
          language: 'python'
        });

      snippetId = createRes.body._id;
    });

    test('Should add a comment to snippet', async () => {
      const res = await request(app)
        .post(`/api/snippets/${snippetId}/comment`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Great code!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toContain('added successfully');
      expect(res.body.comments).toBeInstanceOf(Array);
      expect(res.body.comments[0].text).toBe('Great code!');
    });

    test('Should reject comment without text', async () => {
      const res = await request(app)
        .post(`/api/snippets/${snippetId}/comment`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('required');
    });

    test('Should require authentication to comment', async () => {
      const res = await request(app)
        .post(`/api/snippets/${snippetId}/comment`)
        .send({
          text: 'Great code!'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  // ==========================================
  // TEST 5: REPORT SNIPPETS
  // ==========================================
  describe('POST /api/snippets/:id/report - Report Snippets', () => {

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'test code',
          language: 'python'
        });

      snippetId = createRes.body._id;
    });

    test('Should report a snippet successfully', async () => {
      const res = await request(app)
        .post(`/api/snippets/${snippetId}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Inappropriate content'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toContain('reported successfully');
    });

    test('Should prevent duplicate reports from same user', async () => {
      // First report
      await request(app)
        .post(`/api/snippets/${snippetId}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Inappropriate content'
        });

      // Try to report again
      const res = await request(app)
        .post(`/api/snippets/${snippetId}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Spam'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('already reported');
    });

    test('Should require authentication to report', async () => {
      const res = await request(app)
        .post(`/api/snippets/${snippetId}/report`)
        .send({
          reason: 'Inappropriate'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  // ==========================================
  // TEST 6: FEED INTEGRATION TEST
  // ==========================================
  describe('Global Feed Integration', () => {

    test('Complete feed workflow: create, view, like, comment', async () => {
      // 1. Create snippet
      const createRes = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Snippet',
          code: 'console.log("test")',
          language: 'python'
        });

      expect(createRes.statusCode).toBe(201);
      const snippetId = createRes.body._id;

      // 2. Fetch global feed
      const feedRes = await request(app)
        .get('/api/snippets');

      expect(feedRes.statusCode).toBe(200);
      const snippet = feedRes.body.data.find(s => s._id === snippetId);
      expect(snippet).toBeDefined();
      expect(snippet.user.name).toBe('Test User');

      // 3. Like the snippet
      const likeRes = await request(app)
        .post(`/api/snippets/${snippetId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(likeRes.statusCode).toBe(200);
      expect(likeRes.body.likesCount).toBe(1);

      // 4. Add comment
      const commentRes = await request(app)
        .post(`/api/snippets/${snippetId}/comment`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Nice snippet!'
        });

      expect(commentRes.statusCode).toBe(200);
      expect(commentRes.body.comments.length).toBe(1);
    });
  });

  // ==========================================
  // TEST 7: PAGINATION - INFINITE SCROLL
  // ==========================================
  describe('GET /api/snippets - Pagination (Infinite Scroll)', () => {

    beforeEach(async () => {
      // Create 25 snippets for pagination testing
      for (let i = 1; i <= 25; i++) {
        await request(app)
          .post('/api/snippets')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: `Snippet ${i}`,
            code: `code snippet ${i}`,
            language: i % 5 === 0 ? 'python' : i % 4 === 0 ? 'java' : i % 3 === 0 ? 'cpp' : i % 2 === 0 ? 'html' : 'c'
          });
      }
    });

    test('Should return paginated results with default pagination (page=1, limit=10)', async () => {
      const res = await request(app)
        .get('/api/snippets');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.count).toBeLessThanOrEqual(10);
      expect(res.body.totalSnippets).toBeGreaterThanOrEqual(25);
      expect(res.body.totalPages).toBeGreaterThanOrEqual(3);
      expect(res.body.hasMore).toBe(true);
    });

    test('Should return page 2 with correct results', async () => {
      const res = await request(app)
        .get('/api/snippets?page=2&limit=10');

      expect(res.statusCode).toBe(200);
      expect(res.body.currentPage).toBe(2);
      expect(res.body.count).toBeLessThanOrEqual(10);
      expect(res.body.hasMore).toBe(true);
    });

    test('Should return last page with hasMore=false', async () => {
      const res = await request(app)
        .get('/api/snippets?page=3&limit=10');

      expect(res.statusCode).toBe(200);
      expect(res.body.currentPage).toBe(3);
      expect(res.body.hasMore).toBe(false);
    });

    test('Should support custom limit parameter', async () => {
      const res = await request(app)
        .get('/api/snippets?page=1&limit=5');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBeLessThanOrEqual(5);
      expect(res.body.totalPages).toBeGreaterThanOrEqual(5);
    });

    test('Should return correct total counts and pages', async () => {
      const res = await request(app)
        .get('/api/snippets?page=1&limit=10');

      expect(res.statusCode).toBe(200);
      const expectedPages = Math.ceil(res.body.totalSnippets / 10);
      expect(res.body.totalPages).toBe(expectedPages);
    });

    test('Should reject invalid page number (page < 1)', async () => {
      const res = await request(app)
        .get('/api/snippets?page=0');

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('Page must be greater than 0');
    });

    test('Should reject invalid limit (limit > 100)', async () => {
      const res = await request(app)
        .get('/api/snippets?limit=101');

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('between 1 and 100');
    });

    test('Should reject invalid limit (limit < 1)', async () => {
      const res = await request(app)
        .get('/api/snippets?limit=0');

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('between 1 and 100');
    });

    test('Should return snippets sorted by newest first on all pages', async () => {
      const page1 = await request(app).get('/api/snippets?page=1&limit=10');
      const page2 = await request(app).get('/api/snippets?page=2&limit=10');

      // Check page 1 is sorted newest first
      for (let i = 0; i < page1.body.data.length - 1; i++) {
        const current = new Date(page1.body.data[i].createdAt).getTime();
        const next = new Date(page1.body.data[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }

      // Check page 2 is sorted newest first
      for (let i = 0; i < page2.body.data.length - 1; i++) {
        const current = new Date(page2.body.data[i].createdAt).getTime();
        const next = new Date(page2.body.data[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    test('Should limit comments to 3 in feed responses', async () => {
      // Create snippet with many comments
      const snippetRes = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'test code',
          language: 'python'
        });

      const snippetId = snippetRes.body._id;

      // Add 5 comments
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post(`/api/snippets/${snippetId}/comment`)
          .set('Authorization', `Bearer ${token}`)
          .send({ text: `Comment ${i}` });
      }

      // Fetch feed
      const feedRes = await request(app)
        .get('/api/snippets?page=1&limit=10');

      const snippet = feedRes.body.data.find(s => s._id === snippetId);
      expect(snippet.comments.length).toBeLessThanOrEqual(3);
      expect(snippet.totalComments).toBe(5);
      expect(snippet.showMoreComments).toBe(true);
    });

    test('Should show showMoreComments flag when comments > 3', async () => {
      const snippetRes = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'test',
          language: 'python'
        });

      const snippetId = snippetRes.body._id;

      // Add 4 comments
      for (let i = 1; i <= 4; i++) {
        await request(app)
          .post(`/api/snippets/${snippetId}/comment`)
          .set('Authorization', `Bearer ${token}`)
          .send({ text: `Comment ${i}` });
      }

      const feedRes = await request(app)
        .get('/api/snippets');

      const snippet = feedRes.body.data.find(s => s._id === snippetId);
      expect(snippet.showMoreComments).toBe(true);
    });
  });

  // ==========================================
  // TEST 8: COMMENT PAGINATION ENDPOINT
  // ==========================================
  describe('GET /api/snippets/:id/comments - Comment Pagination', () => {

    let snippetId;

    beforeEach(async () => {
      // Create a snippet
      const snippetRes = await request(app)
        .post('/api/snippets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'test code',
          language: 'python'
        });

      snippetId = snippetRes.body._id;

      // Add 15 comments to the snippet
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .post(`/api/snippets/${snippetId}/comment`)
          .set('Authorization', `Bearer ${token}`)
          .send({ text: `Comment ${i}` });
      }
    });

    test('Should fetch comments with pagination (page 1)', async () => {
      const res = await request(app)
        .get(`/api/snippets/${snippetId}/comments?page=1&limit=5`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(5);
      expect(res.body.totalComments).toBe(15);
      expect(res.body.totalPages).toBe(3);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.hasMore).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    test('Should fetch comments page 2', async () => {
      const res = await request(app)
        .get(`/api/snippets/${snippetId}/comments?page=2&limit=5`);

      expect(res.statusCode).toBe(200);
      expect(res.body.currentPage).toBe(2);
      expect(res.body.hasMore).toBe(true);
      expect(res.body.count).toBe(5);
    });

    test('Should return hasMore=false on last page', async () => {
      const res = await request(app)
        .get(`/api/snippets/${snippetId}/comments?page=3&limit=5`);

      expect(res.statusCode).toBe(200);
      expect(res.body.currentPage).toBe(3);
      expect(res.body.hasMore).toBe(false);
      expect(res.body.count).toBe(5);
    });

    test('Should support custom limit for comments', async () => {
      const res = await request(app)
        .get(`/api/snippets/${snippetId}/comments?page=1&limit=10`);

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBeLessThanOrEqual(10);
      expect(res.body.totalPages).toBe(2);
    });

    test('Should return 404 for non-existent snippet', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/snippets/${fakeId}/comments`);

      expect(res.statusCode).toBe(404);
      expect(res.body.msg).toBe('Snippet not found');
    });

    test('Should reject invalid page parameter', async () => {
      const res = await request(app)
        .get(`/api/snippets/${snippetId}/comments?page=0`);

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('Page must be greater than 0');
    });

    test('Should reject invalid limit parameter', async () => {
      const res = await request(app)
        .get(`/api/snippets/${snippetId}/comments?limit=101`);

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain('between 1 and 100');
    });

    test('Should be public endpoint (no auth required)', async () => {
      const res = await request(app)
        .get(`/api/snippets/${snippetId}/comments`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

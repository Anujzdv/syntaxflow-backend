# 🚀 Syntax Flow - Backend API

**Real-time Code Execution & Collaboration Platform - Backend**

A robust and scalable Node.js backend API that powers the Syntax Flow platform, enabling real-time code execution, instant collaboration, and seamless user management.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![REST API](https://img.shields.io/badge/REST%20API-4CAF50?style=flat-square)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Deployment](#deployment)

---

## ✨ Features

- ✅ **Real-time Code Execution** - Execute code in multiple programming languages
- ✅ **User Authentication** - Secure Firebase-based authentication
- ✅ **Project Management** - Create, update, and manage code projects
- ✅ **Collaboration** - Real-time updates with WebSocket support
- ✅ **Code Sharing** - Share projects with other users
- ✅ **Execution History** - Track code execution history and outputs
- ✅ **RESTful APIs** - Clean, documented REST endpoints
- ✅ **CORS Support** - Cross-origin resource sharing enabled

---

## 🛠 Tech Stack

### **Runtime & Framework**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **REST API** - Standard architectural style

### **Database & Authentication**
- **Firebase** - Backend-as-a-Service
- **Firebase Firestore** - NoSQL document database
- **Firebase Admin SDK** - Server-side Firebase access

### **Real-time Communication**
- **Socket.io** - Real-time event-based communication
- **WebSocket** - Protocol for two-way communication

### **Development Tools**
- **dotenv** - Environment variable management
- **Nodemon** - Auto-reload on code changes
- **CORS** - Cross-Origin Resource Sharing

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v16.x or higher)
- **npm** (v7.x or higher)
- **Git**
- **Firebase Project** with Firestore enabled

### Step 1: Clone the Repository

```bash
git clone https://github.com/Anujzdv/syntaxflow-backend.git
cd syntaxflow-backend
```

### Step 2: Install Dependencies

```bash
npm install
```

---

## ⚙️ Configuration

### Step 1: Create Environment File

```bash
cp .env.example .env
```

### Step 2: Configure Environment Variables

Edit `.env` file:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

EXECUTION_TIMEOUT=5000
MAX_OUTPUT_SIZE=5mb
```

### Step 3: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Extract and add values to `.env`

---

## ▶️ Running the Server

### Development Mode

```bash
npm run dev
```

Server starts at: `http://localhost:5000`

### Production Mode

```bash
npm start
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `POST /api/projects/create` - Create new project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:projectId` - Get project details
- `PUT /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project

### Code Execution
- `POST /api/execution/run` - Execute code
- `GET /api/execution/history` - Get execution history
- `GET /api/execution/:executionId` - Get execution details

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

---

## 💾 Database Schema

### Users Collection
```javascript
users/{uid}
{
  uid: string,
  email: string,
  name: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Projects Collection
```javascript
projects/{projectId}
{
  id: string,
  title: string,
  code: string,
  language: string,
  ownerId: uid,
  visibility: "private" | "public",
  createdAt: timestamp
}
```

### Execution History
```javascript
executions/{executionId}
{
  id: string,
  projectId: string,
  userId: uid,
  output: string,
  status: "success" | "error",
  executionTime: number,
  createdAt: timestamp
}
```

---

## 🌐 Deployment

### Deploy to Render

1. Push code to GitHub
2. Go to [Render](https://render.com)
3. Create new **Web Service**
4. Connect GitHub repository
5. Set build command: `npm install`
6. Set start command: `npm start`
7. Add environment variables
8. Deploy

### Deploy to Railway

```bash
npm i -g @railway/cli
railway login
railway link
railway up
```

---

## 🤝 Contributing

Contributions are welcome! Please follow conventional commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
```

---

## 📄 License

MIT License

---

## 👥 Contact

- 📧 **Email**: anujzdv@gmail.com
- 💼 **LinkedIn**: [Anuj Kumar](https://linkedin.com/in/anujzdv)
- 🐙 **GitHub**: [@Anujzdv](https://github.com/Anujzdv)

---

<div align="center">

**Made with ❤️ by Anuj Kumar**

</div>

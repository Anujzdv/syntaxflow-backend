require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB instance (with timeout)
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}, 30000); // 30 second timeout for MongoMemoryServer startup

afterAll(async () => {
  // Close database connection
  if (mongoose.connection) {
    await mongoose.connection.close();
  }
  
  // Stop in-memory MongoDB server
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // NOTE: Don't clear collections before each test since we're using an isolated
  // in-memory MongoDB instance. This would wipe out data created in beforeAll hooks.
  // If needed, individual tests can clear specific collections they use.
});

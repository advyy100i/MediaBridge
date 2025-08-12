const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const MediaAsset = require('../models/MediaAsset');
const MediaViewLog = require('../models/MediaViewLog');
const AdminUser = require('../models/AdminUser');
const bcrypt = require('bcrypt');

let mongoServer;
let app;
let mediaId;
let token;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri; // app.js will connect to in-memory DB

  await mongoose.connect(uri);

  // Require app AFTER DB is ready
  app = require('../app');

  // Create test user
  const hashed = await bcrypt.hash('password123', 10);
  await AdminUser.create({ email: 'test@example.com', hashed_password: hashed });

  // Login to get JWT
  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email: 'test@example.com', password: 'password123' });
  token = loginRes.body.token;

  // Seed media
  const media = await MediaAsset.create({
    title: 'Test Media',
    type: 'video',
    file_url: '/uploads/test.mp4'
  });
  mediaId = media._id;

  // Seed view logs
  await MediaViewLog.create([
    { media_id: mediaId, viewed_by_ip: '127.0.0.1' },
    { media_id: mediaId, viewed_by_ip: '192.168.0.5' },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('API Endpoints', () => {
  it('should return analytics data for a valid media ID', async () => {
    const res = await request(app)
      .get(`/media/${mediaId}/analytics`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total_views');
    expect(res.body).toHaveProperty('unique_ips');
    expect(res.body).toHaveProperty('views_per_day');
  });

  it('should handle invalid routes', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});

jest.setTimeout(60000);

const mockCollection = {
  countDocuments: jest.fn().mockResolvedValue(0),
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([]),
};

jest.mock('../config/db', () => {
  const mockDb = { collection: jest.fn(() => mockCollection) };
  const mockConnect = jest.fn().mockResolvedValue(mockDb);
  mockConnect.then = (fn) => fn(mockDb);
  return { connectDB: mockConnect, closeDB: jest.fn().mockResolvedValue() };
});

const request = require('supertest');
const { initApp } = require('../server');
const { closeDB } = require('../config/db');

let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/testdb';
  process.env.DB_NAME = 'testdb';
  process.env.SESSION_SECRET = 'testsecret';

  app = await initApp();
});

afterAll(async () => {
  await closeDB();
});

describe('GET /post', () => {
  it('should render list page', async () => {
    const res = await request(app).get('/post');
    expect(res.statusCode).toBe(200);
  });
});

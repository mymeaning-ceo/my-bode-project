jest.setTimeout(60000);

const mockCoupangAdd = {
  aggregate: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([{ date: '20240601', cost: 100 }]) })),
};
const mockAdHistory = {
  updateOne: jest.fn().mockResolvedValue(),
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([{ date: '20240601', cost: 100 }]),
};

jest.mock('../config/db', () => {
  const mockDb = {
    collection: jest.fn((name) => {
      if (name === 'coupangAdd') return mockCoupangAdd;
      if (name === 'adHistory') return mockAdHistory;
      return {};
    }),
  };
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

test('POST /api/ad-history/update aggregates data and returns list', async () => {
  const res = await request(app).post('/api/ad-history/update');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual([{ date: '20240601', cost: 100 }]);
  expect(app.locals.db.collection).toHaveBeenCalledWith('adHistory');
  expect(mockAdHistory.updateOne).toHaveBeenCalled();
});

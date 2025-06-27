jest.setTimeout(60000);

jest.mock('../config/db', () => {
  const mockCollection = {
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
  };
  const mockDb = { collection: jest.fn(() => mockCollection) };
  const mockConnect = jest.fn().mockResolvedValue(mockDb);
  mockConnect.then = (fn) => fn(mockDb);
  return { connectDB: mockConnect, closeDB: jest.fn().mockResolvedValue() };
});

jest.mock('node-fetch');
const mockFetch = require('node-fetch');

const request = require('supertest');
const { initApp } = require('../server');
const { closeDB } = require('../config/db');

let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/testdb';
  process.env.DB_NAME = 'testdb';
  process.env.SESSION_SECRET = 'testsecret';
  process.env.CP_ACCESS_KEY = 'access';
  process.env.CP_SECRET_KEY = 'secret';
  process.env.CP_VENDOR_ID = 'vendor';

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ productId: '1234', name: 'Sample' }),
  });

  app = await initApp();
});

afterAll(async () => {
  await closeDB();
});

test('GET /api/coupang-open/product/:id returns product data', async () => {
  const res = await request(app).get('/api/coupang-open/product/1234');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ productId: '1234', name: 'Sample' });
  expect(mockFetch).toHaveBeenCalled();
});

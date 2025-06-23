jest.setTimeout(60000);

jest.mock('../config/db', () => {
  const mockDb = { collection: jest.fn() };
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
  process.env.CP_RG_AUTH_TOKEN = 'token';

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ result: 'ok' }),
  });

  app = await initApp();
});

afterAll(async () => {
  await closeDB();
});

test('POST /api/coupang-open/product/create creates product', async () => {
  const res = await request(app)
    .post('/api/coupang-open/product/create')
    .send({ name: 'Sample' });
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ result: 'ok' });
  expect(mockFetch).toHaveBeenCalled();
});

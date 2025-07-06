jest.setTimeout(60000);

const mockCollection = {
  bulkWrite: jest.fn().mockResolvedValue(),
  deleteMany: jest.fn().mockResolvedValue(),
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
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

describe('GET /api/coupang/detail/:id', () => {
  it('returns detail data when item exists', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null); // logo lookup
    mockCollection.findOne.mockResolvedValueOnce({
      'Option ID': '123',
      'Product name': 'Prod',
    });
    mockCollection.toArray
      .mockResolvedValueOnce([]) // banner lookup
      .mockResolvedValueOnce([
        { 'Option ID': '123' },
        { 'Option ID': '456' },
      ])
      .mockResolvedValueOnce([]); // sales lookup
    const res = await request(app).get('/api/coupang/detail/123');
    expect(res.statusCode).toBe(200);
    expect(res.body.item['Option ID']).toBe('123');
    expect(Array.isArray(res.body.options)).toBe(true);
  });

  it('returns 404 when item not found', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/coupang/detail/999');
    expect(res.statusCode).toBe(404);
  });
});

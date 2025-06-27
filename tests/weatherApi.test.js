jest.setTimeout(60000);

// Mock MongoDB config
const mockCollection = {
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockReturnThis(),
  project: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([]),
};
jest.mock('../config/db', () => {
  const mockDb = { collection: jest.fn(() => mockCollection) };
  const mockConnect = jest.fn().mockResolvedValue(mockDb);
  mockConnect.then = (fn) => fn(mockDb);
  return { connectDB: mockConnect, closeDB: jest.fn().mockResolvedValue() };
});

// Mock node-fetch
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
  process.env.WEATHER_API_KEY = 'testkey';

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      response: {
        body: {
          items: {
            item: [
              { category: 'T1H', fcstValue: '20' },
              { category: 'SKY', fcstValue: '1' },
              { category: 'PTY', fcstValue: '0' },
            ],
          },
        },
      },
    }),
  });

  app = await initApp();
});

beforeEach(() => {
  mockCollection.find.mockClear();
  mockCollection.project.mockClear();
  mockCollection.sort.mockClear();
  mockCollection.toArray.mockClear();
});

afterAll(async () => {
  await closeDB();
});

test('GET /api/weather/daily returns parsed weather data', async () => {
  const res = await request(app).get('/api/weather/daily');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({
    temperature: '20',
    sky: '1',
    precipitationType: '0',
  });
});

test('GET /api/weather/same-day returns past years data', async () => {
  mockCollection.toArray.mockResolvedValueOnce([
    { _id: '20240627' },
    { _id: '20230627' },
  ]);

  const res = await request(app).get(
    '/api/weather/same-day?date=2024-06-27&years=2'
  );

  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual([
    { _id: '20240627' },
    { _id: '20230627' },
  ]);
  expect(mockCollection.find).toHaveBeenCalledWith({
    _id: { $in: ['20240627', '20230627'] },
  });
  expect(mockCollection.project).toHaveBeenCalledWith({ _id: 1 });
  expect(mockCollection.sort).toHaveBeenCalledWith({ _id: -1 });
});

jest.setTimeout(60000);

// Mock MongoDB config
const mockCollection = {
  find: jest.fn().mockReturnThis(),
  project: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
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
  mockCollection.findOne.mockReset();
  mockCollection.toArray.mockReset();
  mockCollection.find.mockReturnThis();
  mockCollection.project.mockReturnThis();
  mockCollection.sort.mockReturnThis();
});

afterAll(async () => {
  await closeDB();
});

test('GET /api/weather/daily returns parsed weather data', async () => {
  mockCollection.findOne.mockResolvedValueOnce(null); // logo
  mockCollection.toArray.mockResolvedValueOnce([]);   // banners
  const res = await request(app).get('/api/weather/daily');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({
    temperature: '20',
    sky: '1',
    precipitationType: '0',
  });
});

test('GET /api/weather/summary returns averaged data', async () => {
  mockCollection.findOne.mockResolvedValueOnce(null); // logo
  mockCollection.toArray.mockResolvedValueOnce([]);   // banners
  mockCollection.toArray.mockResolvedValue([
    { TMX: '20', TMN: '10', POP: '50' },
    { TMX: '22', TMN: '12', POP: '70' },
  ]);

  const res = await request(app).get('/api/weather/summary');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({
    averageMax: '21.0',
    averageMin: '11.0',
    averagePop: '60.0',
    days: 2,
  });
});

test('GET /api/weather/date/:date returns a document', async () => {
  mockCollection.findOne
    .mockResolvedValueOnce(null) // logo
    .mockResolvedValueOnce({ _id: '20240627', TMX: '25' });
  mockCollection.toArray.mockResolvedValueOnce([]); // banners
  const res = await request(app).get('/api/weather/date/2024-06-27');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ _id: '20240627', TMX: '25' });
});

test('GET /api/weather/range returns documents', async () => {
  mockCollection.findOne.mockResolvedValueOnce(null); // logo
  mockCollection.toArray
    .mockResolvedValueOnce([]) // banners
    .mockResolvedValue([{ _id: '20240601' }, { _id: '20240627' }]);
  const res = await request(app).get('/api/weather/range?date=2024-06-27&period=3m');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual([{ _id: '20240601' }, { _id: '20240627' }]);
});

test('GET /api/weather/same-day returns past years data', async () => {
  mockCollection.findOne
    .mockResolvedValueOnce(null) // logo
    .mockResolvedValueOnce({ _id: '20240627' })
    .mockResolvedValueOnce({ _id: '20230627' });
  mockCollection.toArray.mockResolvedValueOnce([]); // banners
  const res = await request(app).get('/api/weather/same-day?date=2024-06-27&years=2');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual([{ _id: '20240627' }, { _id: '20230627' }]);
});

jest.setTimeout(60000);

// Mock MongoDB config
const mockCollection = {
  find: jest.fn().mockReturnThis(),
  project: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  updateOne: jest.fn().mockResolvedValue({}),
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
const path = require('path');

jest.mock('xlsx', () => ({
  readFile: jest.fn(() => ({ SheetNames: ['s'], Sheets: { s: {} } })),
  utils: { sheet_to_json: jest.fn(() => [{ date: '2024-06-01', temperature: 20, sky: 1, precipitationType: 0 }]) },
}));

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
  mockCollection.toArray
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([
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

test('GET /api/weather/monthly returns array of daily data', async () => {
  const res = await request(app).get('/api/weather/monthly?year=2024&month=06');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
});

test('GET /api/weather/average returns average temperature', async () => {
  const res = await request(app).get(
    '/api/weather/average?year=2024&month=06&day=01'
  );
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({
    date: '2024-06-01',
    averageTemperature: '20.0',
  });
});

test('POST /api/weather/upload stores data', async () => {
  mockCollection.bulkWrite = jest.fn().mockResolvedValue({});
  const res = await request(app)
    .post('/api/weather/upload')
    .attach('excelFile', path.join(__dirname, 'fixtures', 'dummy.xlsx'));
  expect(res.statusCode).toBe(200);
  expect(mockCollection.bulkWrite).toHaveBeenCalled();
});

test('GET /api/weather/history returns stored docs', async () => {
  mockCollection.find.mockReturnThis();
  mockCollection.sort.mockReturnThis();
  mockCollection.toArray.mockResolvedValueOnce([{ _id: '20240601' }]);
  const res = await request(app).get(
    '/api/weather/history?from=2024-06-01&to=2024-06-02',
  );
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual([{ _id: '20240601' }]);
});

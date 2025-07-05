jest.setTimeout(60000);

const mockCollection = {
  aggregate: jest.fn().mockReturnThis(),
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
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

test('GET /api/dashboard/ad-cost-daily returns aggregated data', async () => {
  mockCollection.toArray.mockResolvedValueOnce([
    { date: '2024-06-01', totalCost: 100 },
    { date: '2024-06-02', totalCost: 200 },
  ]);

  const res = await request(app).get('/api/dashboard/ad-cost-daily');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual([
    { date: '2024-06-01', totalCost: 100 },
    { date: '2024-06-02', totalCost: 200 },
  ]);
  expect(app.locals.db.collection).toHaveBeenCalledWith('adHistory');
  expect(mockCollection.aggregate).toHaveBeenCalled();
});

test('GET /api/dashboard/city-temp returns data from db', async () => {
  mockCollection.toArray.mockResolvedValueOnce([
    { time: '2024-06-27T10:00', temperature: 21.2 },
  ]);

  const res = await request(app).get('/api/dashboard/city-temp?city=seoul');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual([
    { time: '2024-06-27T10:00', temperature: 21.2 },
  ]);
  expect(app.locals.db.collection).toHaveBeenCalledWith('cityWeather');
  expect(mockCollection.find).toHaveBeenCalledWith({ city: 'seoul' });
});

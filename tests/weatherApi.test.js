jest.setTimeout(60000);

// Mock MongoDB config
jest.mock('../config/db', () => {
  const mockDb = { collection: jest.fn() };
  const mockConnect = jest.fn().mockResolvedValue(mockDb);
  mockConnect.then = (fn) => fn(mockDb);
  return { connectDB: mockConnect, closeDB: jest.fn().mockResolvedValue() };
});

// Mock node-fetch
jest.mock('node-fetch');
const mockFetch = require('node-fetch');

// Mock child_process.spawn to emulate Python script
jest.mock('child_process', () => {
  const EventEmitter = require('events');
  return {
    spawn: jest.fn(() => {
      const proc = new EventEmitter();
      proc.stdout = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.kill = jest.fn();
      proc.killed = false;
      process.nextTick(() => {
        proc.stdout.emit('data', Buffer.from('[{"time":"2024-01-01","tavg":1}]'));
        proc.emit('close', 0);
      });
      return proc;
    }),
  };
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

test('GET /api/weather/meteostat returns python weather data', async () => {
  const res = await request(app).get('/api/weather/meteostat');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual([
    { time: '2024-01-01', tavg: 1 }
  ]);
});

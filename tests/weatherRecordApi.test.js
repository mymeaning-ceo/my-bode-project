// tests/weatherRecordApi.test.js
jest.setTimeout(60000);

const mockCollection = {
  insertOne: jest.fn().mockResolvedValue({ insertedId: '20250601' }),
  findOne: jest.fn().mockResolvedValue({ _id: '20250601', temperature: 22.6 }),
  findOneAndUpdate: jest.fn().mockResolvedValue({ value: { _id: '20250601', temperature: 25.1 } }),
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

test('POST /api/weather/record inserts a record', async () => {
  const res = await request(app)
    .post('/api/weather/record')
    .send({ _id: '20250601', temperature: 22.6 });
  expect(res.statusCode).toBe(201);
  expect(res.body).toEqual({ insertedId: '20250601' });
  expect(mockCollection.insertOne).toHaveBeenCalled();
});

test('GET /api/weather/record/:id returns a record', async () => {
  const res = await request(app).get('/api/weather/record/20250601');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ _id: '20250601', temperature: 22.6 });
  expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: '20250601' });
});

test('PUT /api/weather/record/:id updates a record', async () => {
  const res = await request(app)
    .put('/api/weather/record/20250601')
    .send({ temperature: 25.1 });
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ _id: '20250601', temperature: 25.1 });
  expect(mockCollection.findOneAndUpdate).toHaveBeenCalled();
});

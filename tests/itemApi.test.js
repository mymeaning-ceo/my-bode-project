jest.setTimeout(60000);

const mockCollection = {
  find: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([]),
  insertOne: jest.fn().mockResolvedValue({ insertedId: '1' }),
  updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
  deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
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

test('GET /api/items returns list', async () => {
  const res = await request(app).get('/api/items');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(mockCollection.find).toHaveBeenCalled();
});

test('POST /api/items creates item', async () => {
  const res = await request(app).post('/api/items').send({ name: 'A', price: 1 });
  expect(res.statusCode).toBe(200);
  expect(res.body).toMatchObject({ name: 'A', price: 1, _id: '1' });
  expect(mockCollection.insertOne).toHaveBeenCalled();
});

test('PUT /api/items/:id updates item', async () => {
  const res = await request(app)
    .put('/api/items/1')
    .send({ name: 'B', price: 2 });
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ success: true });
  expect(mockCollection.updateOne).toHaveBeenCalled();
});

test('DELETE /api/items/:id removes item', async () => {
  const res = await request(app).delete('/api/items/1');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ success: true });
  expect(mockCollection.deleteOne).toHaveBeenCalled();
});

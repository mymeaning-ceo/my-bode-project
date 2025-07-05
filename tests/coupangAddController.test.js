jest.setTimeout(60000);

let inserted = [];
const mockCollection = {
  deleteMany: jest.fn().mockResolvedValue(),
  insertMany: jest.fn(async (docs) => { inserted = docs; }),
  aggregate: jest.fn(() => ({
    toArray: jest.fn(async () => {
      const summary = inserted.reduce((acc, doc) => {
        acc[doc['날짜']] = (acc[doc['날짜']] || 0) + doc['광고비'];
        return acc;
      }, {});
      return Object.keys(summary)
        .sort()
        .slice(0, 50)
        .map((d) => ({ 날짜: d, 광고비: summary[d] }));
    })
  })),
  updateOne: jest.fn().mockResolvedValue(),
};

jest.mock('../config/db', () => {
  const mockDb = { collection: jest.fn(() => mockCollection) };
  const mockConnect = jest.fn().mockResolvedValue(mockDb);
  mockConnect.then = (fn) => fn(mockDb);
  return { connectDB: mockConnect, closeDB: jest.fn().mockResolvedValue() };
});

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
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

test('upload normalizes date formats and date summary aggregates', async () => {
  const tmpFile = path.join(__dirname, 'fixtures', 'coupang_add_tmp.xlsx');
  const rows = [
    { '날짜': new Date('2024-06-01'), '광고집행 옵션ID': 'A1', 노출수: 1, 클릭수: 1, 광고비: 10, 클릭률: 0.1 },
    { '날짜': '2024/06/01', '광고집행 옵션ID': 'A1', 노출수: 1, 클릭수: 1, 광고비: 20, 클릭률: 0.2 },
    { '날짜': '2024-06-02', '광고집행 옵션ID': 'B2', 노출수: 1, 클릭수: 1, 광고비: 30, 클릭률: 0.3 },
  ];
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(rows), 'Sheet1');
  xlsx.writeFile(wb, tmpFile);

  const res = await request(app)
    .post('/api/coupang-add/upload')
    .attach('excelFile', tmpFile);
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ status: 'success' });

  const summaryRes = await request(app).get('/api/coupang-add/summary/date');
  expect(summaryRes.statusCode).toBe(200);
  expect(summaryRes.body).toEqual([
    { 날짜: '2024-06-01', 광고비: 30 },
    { 날짜: '2024-06-02', 광고비: 30 },
  ]);

  fs.unlinkSync(tmpFile);
  expect(app.locals.db.collection).toHaveBeenCalledWith('adHistory');
  expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
});


// tests/health.test.js
// ─────────────────────────────────────────────
// 글로벌 타임아웃 (60초)
// ─────────────────────────────────────────────
jest.setTimeout(60000);

// ─────────────────────────────────────────────
// config/db.js 모킹 (절대 경로로 한 번만)
// ─────────────────────────────────────────────
jest.mock("../config/db", () => {
  const mockCollection = {
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
  };
  const mockDb = { collection: jest.fn(() => mockCollection) };
  const mockConnect = jest.fn().mockResolvedValue(mockDb);
  mockConnect.then = (fn) => fn(mockDb); // connectDB.then(...) 호환
  return {
    connectDB: mockConnect,
    closeDB: jest.fn().mockResolvedValue(),
  };
});

// ─────────────────────────────────────────────
// 테스트 준비
// ─────────────────────────────────────────────
const request = require("supertest");
const { initApp } = require("../server");      // ← 경로 수정
const { closeDB } = require("../config/db");   // ← 경로 수정

let app;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.MONGO_URI = "mongodb://127.0.0.1:27017/testdb";
  process.env.DB_NAME = "testdb";
  process.env.SESSION_SECRET = "testsecret";

  app = await initApp(); // 서버 초기화
});

afterAll(async () => {
  await closeDB(); // 모킹된 closeDB 호출
});

describe("GET /", () => {
  it(
    "should return 200 with React index",
    async () => {
      const res = await request(app).get("/");
      expect(res.statusCode).toBe(200);
    },
    60000 // 개별 테스트 타임아웃 (60초)
  );
});
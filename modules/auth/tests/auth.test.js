// jest.setTimeout
jest.setTimeout(30000); // 30초

// ─────────────────────────────────────────────
// 1) database.js 모킹 (필요 시 경로 확인)
// ─────────────────────────────────────────────
jest.mock("../../../database", () => {
  const mockClient = { db: () => ({}) };
  const mockFn = jest.fn().mockResolvedValue(mockClient);
  mockFn.then = (fn) => fn(mockClient); // connectDB.then(...) 호환
  return mockFn;
});

// ─────────────────────────────────────────────
// 2) config/db.js 모킹 (객체 형태로 내보내기)
// ─────────────────────────────────────────────
jest.mock("../../../config/db", () => {
  const mockClient = { db: () => ({}) };
  const mockConnect = jest.fn().mockResolvedValue(mockClient);
  mockConnect.then = (fn) => fn(mockClient);
  return {
    connectDB: mockConnect,
    closeDB: jest.fn().mockResolvedValue(),
  };
});

// ─────────────────────────────────────────────
// 3) 테스트 준비
// ─────────────────────────────────────────────
const request = require("supertest");
const { initApp } = require("../../../server");
const { closeDB } = require("../../../config/db");

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

describe("GET /stock", () => {
  it("should return 302 redirect", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(302);
  });
});
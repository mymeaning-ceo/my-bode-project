jest.setTimeout(30000); // 30초

// ------------------------------------------------------------------
// config/db.js 모킹 (절대 경로로 한 번만)
// ------------------------------------------------------------------
jest.mock("../../config/db", () => {
  const mockClient = { db: () => ({}) };
  const mockConnect = jest.fn().mockResolvedValue(mockClient);
  mockConnect.then = (fn) => fn(mockClient); // connectDB.then(...) 호환
  return {
    connectDB: mockConnect,
    closeDB: jest.fn().mockResolvedValue(),
  };
});

// 필요하다면 아래처럼 alias 처리도 가능 (선택)
// jest.mock("./config/db", () => jest.requireMock("../../config/db"));

const request = require("supertest");
const { initApp } = require("../../server");
const { closeDB } = require("../../config/db");

let app;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.MONGO_URI = "mongodb://127.0.0.1:27017/testdb";
  process.env.DB_NAME = "testdb";
  process.env.SESSION_SECRET = "testsecret";

  app = await initApp();
});

afterAll(async () => {
  await closeDB();
});

describe("GET /stock", () => {
  it("should return 302 redirect (CI 환경)", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(302);
  });
});
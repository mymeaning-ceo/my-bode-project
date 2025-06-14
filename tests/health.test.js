jest.setTimeout(30000); // 30초

// database.js 모킹 (함수 + then)
jest.mock("../database", () => {
  const mockClient = { db: () => ({}) };
  const mockFn = jest.fn().mockResolvedValue(mockClient);
  mockFn.then = (fn) => fn(mockClient);
  return mockFn;
});

// config/db.js 모킹
jest.mock("../config/db", () => {
  const mockClient = { db: () => ({}) };
  const mockConnect = jest.fn().mockResolvedValue(mockClient);
  mockConnect.then = (fn) => fn(mockClient);
  return {
    connectDB: mockConnect,
    closeDB: jest.fn().mockResolvedValue(),
  };
});

const request = require("supertest");
const { initApp } = require("../server");
const { closeDB } = require("../config/db");

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
  it("should return 404 not found (CI 환경)", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(404);
  });
});
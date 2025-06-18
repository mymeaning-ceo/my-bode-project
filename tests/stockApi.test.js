jest.setTimeout(60000);

// Mock DB connection
const mockCollection = { updateMany: jest.fn().mockResolvedValue() };
jest.mock("../config/db", () => {
  const mockDb = { collection: jest.fn(() => mockCollection) };
  const mockConnect = jest.fn().mockResolvedValue(mockDb);
  mockConnect.then = (fn) => fn(mockDb);
  return { connectDB: mockConnect, closeDB: jest.fn().mockResolvedValue() };
});

// Use real multer for file parsing
jest.mock("multer", () => jest.requireActual("multer"));

// Mock child_process.spawn to avoid running Python
jest.mock("child_process", () => {
  const EventEmitter = require("events");
  return {
    spawn: jest.fn(() => {
      const proc = new EventEmitter();
      proc.stdout = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.kill = jest.fn();
      proc.killed = false;
      process.nextTick(() => proc.emit("close", 0));
      return proc;
    }),
  };
});

const request = require("supertest");
const path = require("path");
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

describe("POST /api/stock/upload", () => {
  it("should respond with success", async () => {
    const res = await request(app)
      .post("/api/stock/upload")
      .attach("excelFile", path.join(__dirname, "fixtures", "dummy.xlsx"));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "success" });
  });
});

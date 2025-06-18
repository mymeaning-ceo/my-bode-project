jest.setTimeout(60000);

// Mock DB connection
const mockCollection = {
  updateMany: jest.fn().mockResolvedValue(),
  deleteMany: jest.fn().mockResolvedValue(),
  find: jest.fn(() => mockCollection),
  sort: jest.fn(() => mockCollection),
  toArray: jest.fn().mockResolvedValue([]),
  countDocuments: jest.fn().mockResolvedValue(0),
  findOne: jest.fn().mockResolvedValue(null),
};

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

describe("DELETE /api/stock", () => {
  it("should delete all stock data", async () => {
    const res = await request(app).delete("/api/stock");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "삭제 완료" });

    const db = require("../config/db").connectDB.mock.results[0].value;
    const mockColl = db.collection.mock.results[0].value;
    expect(db.collection).toHaveBeenCalledWith("stock");
    expect(mockColl.deleteMany).toHaveBeenCalledWith({});
  });
});

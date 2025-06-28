jest.setTimeout(60000);

// Mock DB connection
const mockCollection = {
  updateMany: jest.fn().mockResolvedValue(),
  deleteMany: jest.fn().mockResolvedValue(),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([]),
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

    const db = app.locals.db;
    const mockColl = db.collection.mock.results[0].value;
    expect(db.collection).toHaveBeenCalledWith("stock");
    expect(mockColl.deleteMany).toHaveBeenCalledWith({});
  });
});

describe("POST /api/stock", () => {
  it("should insert a new item", async () => {
    mockCollection.insertOne = jest
      .fn()
      .mockResolvedValue({ insertedId: "507f1f77bcf86cd799439011" });

    const res = await request(app)
      .post("/api/stock")
      .send({ item_code: "A1", qty: 1 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ insertedId: "507f1f77bcf86cd799439011" });
    expect(mockCollection.insertOne).toHaveBeenCalled();
  });
});

describe("PUT /api/stock/:id", () => {
  it("should update an item", async () => {
    mockCollection.updateOne = jest.fn().mockResolvedValue({ matchedCount: 1 });

    const res = await request(app)
      .put("/api/stock/507f1f77bcf86cd799439011")
      .send({ qty: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "updated" });
    expect(mockCollection.updateOne).toHaveBeenCalled();
  });
});

jest.setTimeout(60000);

const mockCollection = {
  bulkWrite: jest.fn().mockResolvedValue(),
  deleteMany: jest.fn().mockResolvedValue(),
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
};
jest.mock("../config/db", () => {
  const mockDb = { collection: jest.fn(() => mockCollection) };
  const mockConnect = jest.fn().mockResolvedValue(mockDb);
  mockConnect.then = (fn) => fn(mockDb);
  return { connectDB: mockConnect, closeDB: jest.fn().mockResolvedValue() };
});

jest.mock("multer", () => jest.requireActual("multer"));

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

describe("POST /api/coupang/upload", () => {
  it("should respond with success", async () => {
    const res = await request(app)
      .post("/api/coupang/upload")
      .attach("excelFile", path.join(__dirname, "fixtures", "dummy.xlsx"));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "success" });
  });
});

describe("DELETE /api/coupang", () => {
  it("should delete all coupang data", async () => {
    const res = await request(app).delete("/api/coupang");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "삭제 완료" });

    const db = app.locals.db;
    const mockColl = db.collection.mock.results[0].value;
    expect(db.collection).toHaveBeenCalledWith("coupang");
    expect(mockColl.deleteMany).toHaveBeenCalledWith({});
  });
});

const request = require("supertest");
const { initApp } = require("../server");
const { closeDB, connectDB } = require("../config/db");

jest.setTimeout(60000);

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

describe("DELETE /api/stock", () => {
  it("should delete all stock data", async () => {
    const res = await request(app).delete("/api/stock");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "삭제 완료" });

    const db = connectDB.mock.results[0].value;
    const mockCollection = db.collection.mock.results[0].value;
    expect(db.collection).toHaveBeenCalledWith("stock");
    expect(mockCollection.deleteMany).toHaveBeenCalledWith({});
  });
});

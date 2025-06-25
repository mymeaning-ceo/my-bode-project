// tests/setup.js

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;
let server;

// ─────────────────────────────────────────
// 1. 메모리 MongoDB 서버 실행 및 연결
// ─────────────────────────────────────────
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGO_URI = uri;
  process.env.DB_NAME = "testdb";
  process.env.NODE_ENV = "test";
  process.env.SESSION_SECRET = "testsecret";

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Express 앱 불러오기 및 listen
  const { app } = require("../server");
  server = app.listen(0); // OS가 가용 포트를 할당 (테스트용)
  global.__APP_SERVER__ = server; // 필요시 테스트에서 접근 가능
});

// ─────────────────────────────────────────
// 2. 테스트 간 DB 정리
// ─────────────────────────────────────────
afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

// ─────────────────────────────────────────
// 3. 테스트 종료 시 정리
// ─────────────────────────────────────────
afterAll(async () => {
  if (server) await server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongo) await mongo.stop();
});

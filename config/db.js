// ─────────────────────────────────────────────────────────────
// config/db.js
//   - connectDB(): MongoDB 연결
//   - closeDB():   연결 및 재연결 타이머 종료
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");
console.log("DEBUG MONGO_URI:", process.env.MONGO_URI);
let reconnectTimer = null;

/**
 * MongoDB 연결 함수
 *  - 성공 시 mongoose.connection.db 반환
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/testdb";

  try {
    await mongoose.connect(uri, {
      dbName: process.env.DB_NAME || "testdb",
    });
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    return mongoose.connection.db;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);

    // 테스트 환경이 아닐 때만 재연결 시도
    if (process.env.NODE_ENV !== "test") {
      reconnectTimer = setTimeout(connectDB, 5000);
    }
    throw err;
  }
};

/**
 * MongoDB 연결 종료 함수
 *  - 테스트에서 afterAll 훅에서 호출
 */
const closeDB = async () => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  await mongoose.connection.close();
};

module.exports = { connectDB, closeDB };
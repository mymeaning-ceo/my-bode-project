// ─────────────────────────────────────────────────────────────
// config/db.js
//   - connectDB(): MongoDB 연결
//   - closeDB():   연결 및 재연결 타이머 종료
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");
let reconnectTimer = null;

/**
 * MongoDB 연결 함수
 *  - 성공 시 mongoose.connection.db 반환
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/testdb";
  const dbName = process.env.DB_NAME || "testdb";

  console.log("\u23F3 MongoDB 연결 시도 중...", uri);

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`\u2705 MongoDB 연결 성공: ${mongoose.connection.host}/${dbName}`);
    return mongoose.connection.db;
  } catch (err) {
    console.error("\u274C MongoDB 연결 실패:", err.message);

    // 테스트 환경이 아닐 때만 재연결 시도
    if (process.env.NODE_ENV !== "test") {
      console.log("\uD83D\uDD01 5\uCD08 \uD6C4 \uC7AC\uC2DC\uB3C4\uD569\uB2C8\uB2E4...");
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
  console.log("\uD83D\uDED1 MongoDB \uC5F0\uACB0 \uC885\uB8CC\uB428");
};

module.exports = { connectDB, closeDB };

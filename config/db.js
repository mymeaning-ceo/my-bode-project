// ─────────────────────────────────────────────────────────────
// config/db.js
//   - connectDB(): MongoDB 연결
//   - closeDB():   연결 종료
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

mongoose.connection.on("connected", () => {
  console.log("✅ [mongoose] 연결됨");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ [mongoose] 에러 발생:", err.message);
});
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ [mongoose] 연결 끊김");
});

/**
 * MongoDB 연결 함수
 *  - 성공 시 mongoose.connection.db 반환
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/testdb";
  const dbName = process.env.DB_NAME || "testdb";

  console.log("DEBUG MONGO_URI:", uri);
  console.log("DEBUG DB_NAME:", dbName);

  try {
    const conn = await mongoose.connect(uri, {
      dbName,
    });

    if (conn.connection.readyState !== 1) {
      throw new Error("MongoDB 연결 상태 비정상 (readyState != 1)");
    }

    console.log("✅ MongoDB 연결 성공 (readyState = 1)");
    return conn.connection.db;
  } catch (err) {
    console.error("❌ MongoDB 연결 실패:", err.message);
    throw err;
  }
};

/**
 * MongoDB 연결 종료 함수
 */
const closeDB = async () => {
  await mongoose.connection.close();
  console.log("🛑 MongoDB 연결 종료됨");
};

module.exports = { connectDB, closeDB };

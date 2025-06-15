require('dotenv').config(); // ⭐ 환경변수 먼저 로드
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI;
if (!url) {
  console.error('❌ MONGO_URI 환경변수가 설정되지 않았습니다.');
  module.exports = async () => {
    throw new Error('MONGO_URI not provided');
  };
  return;
}

// ─────────────────────────────────────────
// 테스트 환경: 목(Mock) 클라이언트 반환
// ─────────────────────────────────────────
if (process.env.NODE_ENV === 'test') {
  const mockDb = {}; // 필요한 최소 인터페이스
  const mockFn = async () => mockDb;
  mockFn.then = (fn) => fn(mockDb); // connectDB.then(...) 호환
  module.exports = mockFn;
  return;
}

// ─────────────────────────────────────────
// 프로덕션/개발 환경: 실제 MongoDB 연결
// ─────────────────────────────────────────
const client = new MongoClient(url);

/**
 * connectDB()
 *  - 성공 시 **DB 객체**(MongoClient.db) 반환
 */
const connectDB = async () => {
  await client.connect();
  console.log('✅ MongoDB 연결 성공');
  return client.db(process.env.DB_NAME || 'forum'); // DB 객체 반환
};

// connectDB.then(...) 패턴 호환
connectDB.then = (fn) => connectDB().then(fn);

module.exports = connectDB;
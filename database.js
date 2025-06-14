require('dotenv').config(); // ⭐ 환경변수 먼저 로드
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI;
if (!url) {
  console.error('❌ MONGO_URI 환경변수가 설정되지 않았습니다.');
  module.exports = async () => {
    throw new Error('MONGO_URI not provided');
  };
}

// ─────────────────────────────────────────
// 테스트 환경: 목(Mock) 클라이언트 반환
// ─────────────────────────────────────────
if (process.env.NODE_ENV === 'test') {
  const mockClient = { db: () => ({}) };
  const mockFn = async () => mockClient;
  mockFn.then = (fn) => fn(mockClient); // connectDB.then(...) 호환
  module.exports = mockFn;
  return;
}

// ─────────────────────────────────────────
// 프로덕션/개발 환경: 실제 MongoDB 연결
// ─────────────────────────────────────────
const client = new MongoClient(url);

/**
 * connectDB()
 *  - 성공 시 MongoClient 인스턴스 반환
 */
const connectDB = async () => {
  await client.connect();
  console.log('✅ MongoDB 연결 성공');
  return client;
};

// connectDB.then(...) 패턴 호환
connectDB.then = (fn) => connectDB().then(fn);

module.exports = connectDB;
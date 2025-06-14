require('dotenv').config(); // ⭐ 환경변수 먼저 로드
const { MongoClient } = require('mongodb');

const url = process.env.MONGO_URI;  // ← 변경
if (!url) {
  console.error('❌ MONGO_URI 환경변수가 설정되지 않았습니다.');
  module.exports = Promise.reject(new Error('MONGO_URI not provided'));
  return;
}

const client = new MongoClient(url);

const connectDB = client
  .connect()
  .then(() => {
    console.log('✅ MongoDB 연결 성공');
    return client;
  })
  .catch((err) => {
    console.error('❌ MongoDB 연결 실패:', err);
    throw err;
  });

module.exports = connectDB;
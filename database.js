require('dotenv').config(); // ⭐ 환경변수 먼저 로드
const { MongoClient } = require('mongodb');

const url = process.env.DB_URL;
if (!url) {
  console.error('❌ DB_URL 환경변수가 설정되지 않았습니다.');
  module.exports = Promise.reject(new Error('DB_URL not provided'));
  return;
}

const client = new MongoClient(url);

let connectDB = client.connect()
  .then(() => {
    console.log('✅ MongoDB 연결 성공');
    return client;
  })
  .catch((err) => {
    console.error('❌ MongoDB 연결 실패:', err);
    throw err;
  });

module.exports = connectDB;

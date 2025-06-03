require('dotenv').config(); // ⭐ 환경변수 먼저 로드
const { MongoClient } = require('mongodb');

const url = process.env.DB_URL;
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

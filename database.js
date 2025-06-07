require('dotenv').config(); // ⭐ 환경변수 먼저 로드
const { MongoClient } = require('mongodb');

const url = process.env.DB_URL;
// useNewUrlParser and useUnifiedTopology are deprecated in mongodb >= 4.0
// The driver now uses the modern connection string parser and topology engine
// by default, so we can omit those options entirely.
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

// ✅ 반드시 dotenv가 제일 먼저 실행되어야 함!
require('dotenv').config();
const { MongoClient } = require('mongodb');

// ✅ 강제 지정 (예외 처리 포함)
if (!process.env.DB_URL) {
  process.env.DB_URL = 'mongodb+srv://andro3817:qwer1234@cluster0.2whurql.mongodb.net/forum?retryWrites=true&w=majority';
}

console.log('✅ 최종 DB_URL:', process.env.DB_URL);  // 반드시 문자열로 출력돼야 함

const client = new MongoClient(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

module.exports = {
  clientPromise: client.connect(),
  getDB: async () => {
    const conn = await client.connect();
    return conn.db('forum');
  }
};

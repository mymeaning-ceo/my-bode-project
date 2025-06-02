require('dotenv').config(); // ⭐ 환경변수 먼저 로드

const { MongoClient } = require('mongodb');

const url = process.env.DB_URL;
const client = new MongoClient(url);

let connectDB = client.connect(); // ⭐ Promise 반환

module.exports = connectDB;

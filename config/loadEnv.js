// config/loadEnv.js
const path = require("path");
const dotenv = require("dotenv");

module.exports = function loadEnv() {
  // .env 파일 위치가 프로젝트 루트라고 가정
  const envPath = path.resolve(__dirname, "../.env");
  dotenv.config({ path: envPath });
  console.log("Environment variables loaded from .env");
};
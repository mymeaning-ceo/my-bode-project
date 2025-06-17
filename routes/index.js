// routes/index.js
const express = require("express");
const router = express.Router();

// 하위 라우터 불러오기
const apiRouter = require("./api");
const wepRouter = require("./wep"); // ./wep/index.js를 자동으로 찾음

// API 라우터는 '/api' 경로로 제공
router.use("/api", apiRouter);

// 필요하다면 '/wep' 대신 다른 하위 경로를 지정할 수 있습니다.
router.use("/", wepRouter);

module.exports = router;

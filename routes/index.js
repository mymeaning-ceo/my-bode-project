// routes/index.js
const express = require("express");
const router = express.Router();

// 하위 라우터 불러오기
const wepRouter = require("./wep"); // ./wep/index.js를 자동으로 찾음

// 필요하다면 '/wep' 대신 다른 하위 경로를 지정할 수 있습니다.
router.use("/", wepRouter);

module.exports = router;

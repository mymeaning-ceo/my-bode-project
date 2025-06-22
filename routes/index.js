// routes/index.js
const express = require("express");
const router = express.Router();

// 하위 라우터 불러오기
// /web 하위 라우터를 불러옵니다. 경로가 잘못되어 "wep" 로 지정되어 있던
// 부분을 "web" 으로 수정했습니다.
const webRouter = require("./web"); // ./web/index.js 를 자동으로 찾음

// 필요하다면 '/wep' 대신 다른 하위 경로를 지정할 수 있습니다.
router.use("/", webRouter);

module.exports = router;
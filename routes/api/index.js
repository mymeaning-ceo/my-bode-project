/**
 * routes/api/index.js
 * -------------------
 * API 엔드포인트를 한 곳에서 모아주는 라우터
 * 예) /api/stock → routes/api/stockApi.js
 */

const express = require("express");
const router = express.Router();

// 인증 API
router.use('/auth', require('./authApi'));

// 재고(Stock) API
router.use("/stock", require("./stockApi"));
// 쿠팡 재고 API
router.use("/coupang", require("./coupangApi"));
// 쿠팡 광고비 API
router.use("/coupang-add", require("./coupangAddApi"));
// 쿠팡 오픈 API 연동
router.use("/coupang-open", require("./coupangOpenApi"));
// 날씨 API
router.use("/weather", require("./weatherApi"));
// 광고 성과 API
router.use("/analytics", require("./analytics"));
// 게시판 API
router.use("/posts", require("./postApi"));

// TODO: 다른 API 라우터 추가 시 아래와 같이 등록
// router.use("/user", require("./userApi"));
// router.use("/order", require("./orderApi"));

module.exports = router;

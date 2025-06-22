const express = require("express");
const router = express.Router();

router.use("/stock", require("../stock"));
router.use("/", require("../auth"));
router.use("/admin", require("../admin"));
router.use("/board", require("../board"));
router.use("/coupang", require("../coupang"));
router.use("/coupang/add", require("../coupangAdd"));
router.use("/help", require("../help"));
router.use("/list", require("../list")); // ← 추가
router.use("/post", require("../post"));

// TODO: 추가 웹 라우터 등록

module.exports = router;
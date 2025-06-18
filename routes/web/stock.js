const express = require("express");
const router = express.Router();
const stockCtrl = require("../../controllers/stockController");

// ───────────────────────────────────────────
// 0. GET /stock (페이지 표시)
// ───────────────────────────────────────────
router.get("/", (req, res) => {
  // stock.ejs를 렌더링
  res.render("stock", {
    title: "재고 관리",
    user: req.user, // 필요 시 전달
  });
});
// ───────────────────────────────────────────
// 2. POST /stock/upload (엑셀 업로드)
// ───────────────────────────────────────────
router.post(
  "/upload",
  stockCtrl.upload,
  stockCtrl.uploadExcel
);

// 전체 삭제
router.post("/delete-all", async (req, res) => {
  const db = req.app.locals.db;
  await db.collection("stock").deleteMany({});
  res.send("삭제 완료");
});

module.exports = router;

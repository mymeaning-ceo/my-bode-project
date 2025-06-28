const express = require("express");
const router = express.Router();
const stockCtrl = require("../../controllers/stockController");

// ───────────────────────────────────────────
// 0. GET /stock (페이지 표시)
// ───────────────────────────────────────────
router.get("/", (req, res) => {
  const path = require("path");
  const reactIndex = path.join(__dirname, "..", "..", "client", "public", "index.html");
  res.sendFile(reactIndex);
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

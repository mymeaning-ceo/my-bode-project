const express = require("express");
const router = express.Router();
const multer = require("multer");
const parseCoupangExcel = require("../../lib/parseCoupangExcel");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });
const { addJob } = require("../../lib/jobQueue");

const DEFAULT_COLUMNS = [
  "Option ID",
  "Product name",
  "Option name",
  "Offer condition",
  "Orderable quantity (real-time)",
  "Sales amount on the last 30 days",
  "Sales in the last 30 days",
  "Shortage quantity",
];

router.post("/upload", upload.single("excelFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "파일이 없습니다." });
  }

  const jobId = addJob("coupang", req.file.path, req.app.locals.db);
  res.json({ jobId });
});

router.delete("/", async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.collection("coupang").deleteMany({});
    res.json({ message: "삭제 완료" });
  } catch (err) {
    console.error("DELETE /api/coupang 오류:", err);
    res.status(500).json({ status: "error", message: "삭제 실패" });
  }
});

module.exports = router;

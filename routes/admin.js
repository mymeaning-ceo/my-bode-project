const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db"); // 구조분해 할당
const multer = require("multer");
const path = require("path");

// ─────────────────────────────────────────
// 1) DB 연결
// ─────────────────────────────────────────
let db;
connectDB()
  .then((clientDb) => {
    db = clientDb; // 이미 db 객체
  })
  .catch((err) => {
    console.error("❌ DB 연결 실패:", err);
  });

// ─────────────────────────────────────────
// 2) Multer 설정 (예시)
// ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `banner_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// ─────────────────────────────────────────
// 3) 예시 라우트: 배너 업로드
// ─────────────────────────────────────────
router.post(
  "/banner/:idx",
  upload.single("banner"),
  async (req, res) => {
    try {
      const idx = req.params.idx;
      const imgLocation = req.file ? req.file.path : "";

      await db.collection("banners").updateOne(
        { idx },
        { $set: { img: imgLocation } },
        { upsert: true }
      );

      res.redirect("/admin/banners");
    } catch (err) {
      console.error("❌ 배너 업로드 실패:", err);
      res.status(500).send("서버 오류");
    }
  }
);

// 필요에 따라 추가 라우트...

module.exports = router;
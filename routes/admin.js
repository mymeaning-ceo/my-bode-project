const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// ─────────────────────────────────────────
// 1) Multer 설정
// ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `banner_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// ─────────────────────────────────────────
// 2) 배너 업로드 라우트
// ─────────────────────────────────────────
router.post("/banner/:idx", upload.single("banner"), async (req, res) => {
  try {
    const db = req.app.locals.db; // 서버에서 저장한 DB 인스턴스 사용
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
});

// 필요에 따라 추가 라우트...

module.exports = router;

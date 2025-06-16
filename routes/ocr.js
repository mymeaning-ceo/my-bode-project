const path = require("path");
const vision = require("@google-cloud/vision");
const multer = require("multer");
const router = require("express").Router();

// 이미 server.js에서 MongoDB를 연결했다면:
const getDB = (req) => req.app.locals.db;

// ────────────────
// Multer 설정
// ────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// ────────────────
// Google Vision 클라이언트
// ────────────────
const visionClient = new vision.ImageAnnotatorClient();

// ─────────────────────────────
//  OCR 업로드/처리 라우트
// ─────────────────────────────
router.post("/ocr/upload", upload.single("file"), async (req, res) => {
  try {
    // 1) Vision API로 텍스트 추출
    const [result] = await visionClient.textDetection(req.file.path);
    const extractedText = result.fullTextAnnotation?.text || "";

    // 2) DB에 저장
    const db = getDB(req);
    const insertResult = await db.collection("ocr").insertOne({
      filename: req.file.filename,
      text: extractedText,
      createdAt: new Date(),
    });

    // 3) 응답
    res.json({
      success: true,
      id: insertResult.insertedId,
      text: extractedText,
    });
  } catch (err) {
    console.error("❌ OCR 저장 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

module.exports = router;
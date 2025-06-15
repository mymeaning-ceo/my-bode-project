const path = require("path");
 const vision = require("@google-cloud/vision");
 const router = require("express").Router();

-// ✅ (삭제) 더 이상 Native Driver 모듈이 없음
-const connectDB = require("../database");
-let db;
-connectDB.then((client) => { db = client; });

+// ✅ (추가) server.js에서 이미 연결된 DB 사용
+const getDB = (req) => req.app.locals.db;

 const visionClient = new vision.ImageAnnotatorClient();

 // ─────────────────────────────
 //  OCR 업로드/처리 라우트 예시
 // ─────────────────────────────
 router.post("/ocr/upload", upload.single("file"), async (req, res) => {
   try {
-    const result = await db.collection("ocr").insertOne({
+    const result = await getDB(req).collection("ocr").insertOne({
       filename: req.file.filename,
       text: extractedText,
       createdAt: new Date(),
     });
     res.json({ success: true, id: result.insertedId });
   } catch (err) {
     console.error("❌ OCR 저장 오류:", err);
     res.status(500).json({ error: "서버 오류" });
   }
 });

 module.exports = router;
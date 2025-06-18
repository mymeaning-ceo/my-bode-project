const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────
// Multer 설정
// ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─────────────────────────────────────────
// 목록 조회 (GET /coupang/add)
// ─────────────────────────────────────────
router.get("/", async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.collection("coupangAdd").find().toArray();
    const fields = result[0]
      ? Object.keys(result[0]).filter((k) => k !== "_id")
      : [];
    res.render("coupangAdd.ejs", {
      결과: result,
      필드: fields,
      성공메시지: null,
    });
  } catch (err) {
    console.error("목록 불러오기 실패:", err);
    res.status(500).send("❌ 목록 불러오기 실패");
  }
});

// ─────────────────────────────────────────
// 엑셀 업로드 (POST /coupang/add/upload)
// ─────────────────────────────────────────
router.post("/upload", upload.single("excelFile"), async (req, res) => {
  const db = req.app.locals.db;
  try {
    if (!req.file)
      return res.status(400).send("❌ 파일이 업로드되지 않았습니다.");

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    await db.collection("coupangAdd").deleteMany({});
    if (data.length > 0) await db.collection("coupangAdd").insertMany(data);

    fs.unlink(filePath, () => {});

    const result = await db.collection("coupangAdd").find().toArray();
    const fields = result[0]
      ? Object.keys(result[0]).filter((k) => k !== "_id")
      : [];
    res.render("coupangAdd.ejs", {
      결과: result,
      필드: fields,
      성공메시지: "✅ 업로드 완료",
    });
  } catch (err) {
    console.error("업로드 실패:", err);
    res.status(500).send("❌ 업로드 실패");
  }
});

// ─────────────────────────────────────────
// 전체 삭제 (POST /coupang/add/delete-all)
// ─────────────────────────────────────────
router.post("/delete-all", async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.collection("coupangAdd").deleteMany({});
    res.redirect("/coupang/add");
  } catch (err) {
    console.error("삭제 실패:", err);
    res.status(500).send("❌ 삭제 실패");
  }
});

module.exports = router;

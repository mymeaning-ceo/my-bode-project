const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const { createWorker } = require("tesseract.js");
const { ObjectId } = require("mongodb");

// ─────────────────────────────────────────
// Multer 설정
// ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

// ─────────────────────────────────────────
// 전표 목록 조회
// ─────────────────────────────────────────
router.get("/", async (req, res) => {
  const db = req.app.locals.db;
  const list = await db
    .collection("vouchers")
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  const rows = await db
    .collection("voucherRecords")
    .find()
    .sort({ 전표일자: -1 })
    .toArray();
  const total = list.reduce((acc, v) => acc + (v["매출금액"] || 0), 0);
  res.render("voucher.ejs", { list, rows, total, logs: null });
});

// ─────────────────────────────────────────
// 전표 이미지 OCR 업로드
// ─────────────────────────────────────────
router.post("/upload", upload.single("image"), async (req, res) => {
  const db = req.app.locals.db;
  if (!req.file) return res.status(400).send("전표 이미지를 업로드해주세요.");

  const logs = [];
  const worker = createWorker({
    logger: (m) => {
      if (m.status === "recognizing text") {
        const pct = (m.progress * 100).toFixed(1);
        logs.push(`OCR 진행률: ${pct}%`);
      }
    },
  });
  const lang = process.env.TESS_LANG || "kor+eng";

  try {
    await worker.load();
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      user_defined_dpi: "300",
    });

    const {
      data: { text },
    } = await worker.recognize(req.file.path);
    logs.push("✅ OCR 인식 완료");
    await worker.terminate();
    fs.unlink(req.file.path, () => {});

    const fields = await parseVoucher(text);
    if (fields) {
      await db
        .collection("vouchers")
        .insertOne({ ...fields, createdAt: new Date() });
    }

    const list = await db
      .collection("vouchers")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    const excelRows = await db
      .collection("voucherRecords")
      .find()
      .sort({ 전표일자: -1 })
      .toArray();
    const total = list.reduce((acc, v) => acc + (v["매출금액"] || 0), 0);
    res.render("voucher.ejs", { list, rows: excelRows, total, logs });
  } catch (err) {
    console.error("Voucher OCR error:", err);
    fs.unlink(req.file.path, () => {});
    logs.push("❌ 전표 처리 실패");

    const list = await db
      .collection("vouchers")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    const excelRows = await db
      .collection("voucherRecords")
      .find()
      .sort({ 전표일자: -1 })
      .toArray();
    const total = list.reduce((acc, v) => acc + (v["매출금액"] || 0), 0);
    res.render("voucher.ejs", { list, rows: excelRows, total, logs });
  }
});

// ─────────────────────────────────────────
// 엑셀 업로드
// ─────────────────────────────────────────
router.post("/excel", upload.single("excelFile"), async (req, res) => {
  const db = req.app.locals.db;
  try {
    if (!req.file)
      return res.status(400).send("엑셀 파일이 업로드되지 않았습니다.");

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const rows = data.map((row) => ({
      전표일자: row["전표일자"],
      전표번호: row["전표번호"],
      송장번호: row["송장번호"],
      금액: row["금액"],
      uploadedAt: new Date(),
    }));
    if (rows.length > 0) await db.collection("voucherRecords").insertMany(rows);
    fs.unlink(req.file.path, () => {});

    const list = await db
      .collection("vouchers")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    const excelRows = await db
      .collection("voucherRecords")
      .find()
      .sort({ 전표일자: -1 })
      .toArray();
    const total = list.reduce((acc, v) => acc + (v["매출금액"] || 0), 0);
    res.render("voucher.ejs", { list, rows: excelRows, total, logs: null });
  } catch (err) {
    console.error("Excel upload error:", err);
    res.status(500).send("업로드 실패");
  }
});

// ─────────────────────────────────────────
// 선택 삭제
// ─────────────────────────────────────────
router.post("/delete-selected", async (req, res) => {
  const db = req.app.locals.db;
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    if (ids && ids.length > 0) {
      await db.collection("voucherRecords").deleteMany({
        _id: { $in: ids.map((id) => new ObjectId(id)) },
      });
    }
    res.redirect("/voucher");
  } catch (err) {
    console.error("Delete selected error:", err);
    res.status(500).send("삭제 실패");
  }
});

// ─────────────────────────────────────────
// OCR 텍스트 → 전표 데이터 변환
// ─────────────────────────────────────────
router.post("/import/:id", async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  try {
    const doc = await db
      .collection("ocrtexts")
      .findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).send("OCR 데이터가 없습니다.");

    const fields = await parseVoucher(doc.text);
    if (fields) {
      await db
        .collection("vouchers")
        .insertOne({ ...fields, createdAt: new Date() });
    }
    await db.collection("ocrtexts").deleteOne({ _id: new ObjectId(id) });
    res.redirect("/voucher");
  } catch (err) {
    console.error("Voucher import error:", err);
    res.status(500).send("전표 변환 실패");
  }
});

// ─────────────────────────────────────────
// GPT를 이용해 전표 텍스트 파싱
// ─────────────────────────────────────────
async function parseVoucher(text) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const prompt = `다음 전표 내용에서 전표 매출일, 공급 세액, 세함가, 상품명, 품명, 출고수량, 매출단가, 매출금액을 JSON으로 반환해 주세요.\n${text}`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      }),
    });
    if (!response.ok) throw new Error("OpenAI error");
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (err) {
    console.error("GPT parsing error:", err);
    return null;
  }
}

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const parseCoupangExcel = require("../../lib/parseCoupangExcel");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

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

// 재고 목록 조회 API
router.get("/", async (req, res) => {
  const db = req.app.locals.db;
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword || "";
    const brand = req.query.brand || "";
    const sortField = DEFAULT_COLUMNS.includes(req.query.sort)
      ? req.query.sort
      : "Product name";
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const shortageOnly = req.query.shortage === "1";

    const conditions = [];
    if (keyword) {
      const regex = new RegExp(keyword, "i");
      conditions.push({
        $or: [
          { "Product name": regex },
          { "Option name": regex },
          { "Option ID": regex },
        ],
      });
    }
    if (brand) {
      conditions.push({ "Product name": new RegExp(brand, "i") });
    }

    const query = conditions.length ? { $and: conditions } : {};
    if (shortageOnly) query["Shortage quantity"] = { $gt: 0 };

    const [rows, total] = await Promise.all([
      db
        .collection("coupang")
        .find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("coupang").countDocuments(query),
    ]);

    res.json({ data: rows, total });
  } catch (err) {
    console.error("GET /api/coupang 오류:", err);
    res.status(500).json({ status: "error", message: "조회 실패" });
  }
});

router.post("/upload", upload.single("excelFile"), async (req, res) => {
  const db = req.app.locals.db;
  try {
    if (!req.file)
      return res.status(400).json({ status: "error", message: "파일이 없습니다." });
    const filePath = req.file.path;
    const data = parseCoupangExcel(filePath).map((item) =>
      DEFAULT_COLUMNS.reduce((acc, col) => {
        acc[col] = item[col] ?? "";
        return acc;
      }, {})
    );
    const bulkOps = data.map((item) => ({
      updateOne: {
        filter: { "Option ID": item["Option ID"] },
        update: { $set: item },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) await db.collection("coupang").bulkWrite(bulkOps);
    fs.unlink(filePath, () => {});
    res.json({ status: "success" });
  } catch (err) {
    console.error("POST /api/coupang/upload 오류:", err);
    res.status(500).json({ status: "error", message: "업로드 실패" });
  }
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

const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const safeReadXlsx = require("../../lib/safeReadXlsx");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

function parseExcel(filePath) {
  const workbook = safeReadXlsx(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }).slice(2);
  return rows
    .map((row) => {
      const obj = {};
      obj["Option ID"] = String(row[2] ?? "").trim();
      obj["Product name"] = row[4] ?? "";
      obj["Option name"] = row[5] ?? "";
      const inventory = Number(String(row[7]).replace(/,/g, "")) || 0;
      obj["Orderable quantity (real-time)"] = inventory;
      const salesAmount = Number(String(row[11]).replace(/,/g, "")) || 0;
      obj["Sales amount on the last 30 days"] = salesAmount;
      const salesCount = Number(String(row[13]).replace(/,/g, "")) || 0;
      obj["Sales in the last 30 days"] = salesCount;
      const daily = salesCount / 30;
      const safety = daily * 7;
      obj["Shortage quantity"] =
        inventory < safety ? Math.ceil(safety - inventory) : 0;
      return obj;
    })
    .filter((item) => item["Option ID"]);
}

router.post("/upload", upload.single("excelFile"), async (req, res) => {
  const db = req.app.locals.db;
  try {
    if (!req.file)
      return res.status(400).json({ status: "error", message: "파일이 없습니다." });
    const filePath = req.file.path;
    const data = parseExcel(filePath);
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

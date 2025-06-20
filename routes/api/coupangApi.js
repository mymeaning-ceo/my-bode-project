const express = require("express");
const router = express.Router();
const multer = require("multer");
const parseCoupangExcel = require("../../lib/parseCoupangExcel");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

router.post("/upload", upload.single("excelFile"), async (req, res) => {
  const db = req.app.locals.db;
  try {
    if (!req.file)
      return res.status(400).json({ status: "error", message: "파일이 없습니다." });
    const filePath = req.file.path;
    const data = parseCoupangExcel(filePath);
    if (data.length === 0) {
      fs.unlink(filePath, () => {});
      return res
        .status(400)
        .json({ status: "error", message: "엑셀 데이터가 없습니다." });
    }
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

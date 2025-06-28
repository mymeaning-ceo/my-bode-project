// routes/api/stockApi.js
const express = require("express");
const router = express.Router();
const stockCtrl = require("../../controllers/stockController");

router.get("/", stockCtrl.getStockData);
router.get("/:id", stockCtrl.getStockItem);
router.post("/", stockCtrl.addStockItem);
router.post("/upload", stockCtrl.upload, stockCtrl.uploadExcelApi);
router.delete("/", async (req, res) => {
  const db = req.app.locals.db;
  await db.collection("stock").deleteMany({});
  res.json({ message: "삭제 완료" });
});
router.put("/:id", stockCtrl.updateStockItem);

module.exports = router;

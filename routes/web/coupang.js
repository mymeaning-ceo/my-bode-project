const express = require("express");
const router = express.Router();
const multer = require("multer");
const parseCoupangExcel = require("../../lib/parseCoupangExcel");
const fs = require("fs");
const path = require("path");
const { checkAuth } = require("../../middlewares/auth");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

const BRANDS = ["BYC", "트라이", "제임스딘", "스페클로", "물랑루즈"];

const 한글 = {
  "Option ID": "옵션ID",
  "Product name": "상품명",
  "Option name": "옵션명",
  "Orderable quantity (real-time)": "재고량",
  "Sales amount on the last 30 days": "30일 판매금액",
  "Sales in the last 30 days": "30일 판매량",
  "Shortage quantity": "부족재고량",
  노출수: "노출수",
  클릭수: "클릭수",
  광고비: "광고비",
  클릭률: "클릭률",
};

const DEFAULT_COLUMNS = [
  "Option ID",
  "Product name",
  "Option name",
  "Orderable quantity (real-time)",
  "Sales amount on the last 30 days",
  "Sales in the last 30 days",
  "Shortage quantity",
  "노출수",
  "클릭수",
  "광고비",
  "클릭률",
];

const IMPORT_COLUMNS = DEFAULT_COLUMNS.filter(col => col !== "Shortage quantity");
const NUMERIC_COLUMNS = [
  "Orderable quantity (real-time)",
  "Sales amount on the last 30 days",
  "Sales in the last 30 days",
  "Shortage quantity",
  "노출수",
  "클릭수",
  "광고비",
  "클릭률",
];

function addShortage(items) {
  return items.map(item => {
    const sales30 = Number(item["Sales in the last 30 days"] || 0);
    const inventory = Number(item["Orderable quantity (real-time)"] || 0);
    const daily = sales30 / 30;
    const safety = daily * 7;
    const shortage = inventory < safety ? Math.ceil(safety - inventory) : 0;
    item["Shortage quantity"] = shortage;
    return item;
  });
}

async function attachAdData(items, db) {
  const optionIds = [...new Set(items.map(it => String(it["Option ID"])))].filter(Boolean);
  if (optionIds.length === 0) return items;

  const ads = await db.collection("coupangAdd")
    .find({ "광고집행 옵션ID": { $in: optionIds } })
    .sort({ 날짜: -1 })
    .toArray();

  const adMap = {};
  ads.forEach(ad => {
    const key = String(ad["광고집행 옵션ID"]);
    if (!adMap[key]) adMap[key] = ad;
  });

  return items.map(item => {
    const ad = adMap[String(item["Option ID"])] || {};
    item["노출수"] = ad["노출수"] || 0;
    item["클릭수"] = ad["클릭수"] || 0;
    item["광고비"] = ad["광고비"] || 0;
    item["클릭률"] = ad["클릭률"] || "0.00";
    return item;
  });
}

router.get("/", async (req, res) => {
  const db = req.app.locals.db;
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;
  const keyword = "";
  const brand = req.query.brand || "";

  try {
    const query = brand ? { "Product name": new RegExp(brand, "i") } : {};
    const [rows, total] = await Promise.all([
      db.collection("coupang").find(query).sort({ "Product name": 1 }).skip(skip).limit(limit).toArray(),
      db.collection("coupang").countDocuments(query),
    ]);

    const result = rows.map(row => {
      const newRow = { ...row };
      if (typeof newRow["Option ID"] === "number") newRow["Option ID"] = String(newRow["Option ID"]);
      NUMERIC_COLUMNS.forEach(col => {
        const num = Number(String(newRow[col]).replace(/,/g, ""));
        newRow[col] = isNaN(num) ? 0 : num;
      });
      return newRow;
    });

    const resultWithShortage = addShortage(result);
    const resultWithAds = await attachAdData(resultWith
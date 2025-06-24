const express = require("express");
const router = express.Router();
const multer = require("multer");
const parseCoupangExcel = require("../../lib/parseCoupangExcel");
const fs = require("fs");
const path = require("path");
const { checkAuth } = require("../../middlewares/auth");

// ─────────────────────────────────────────
// 1) Multer 설정
// ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

// 검색 가능한 브랜드 목록
const BRANDS = ["BYC", "트라이", "제임스딘", "스페클로", "물랑루즈"];

const 한글 = {
  "Option ID": "옵션ID",
  "Product name": "상품명",
  "Option name": "옵션명",
  "Offer condition": "상품상태",
  "Orderable quantity (real-time)": "재고량",
  "Sales amount on the last 30 days": "30일 판매금액",
  "Sales in the last 30 days": "30일 판매량",
  "Shortage quantity": "부족재고량",
  // 광고 지표 컬럼 제거
};

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

const IMPORT_COLUMNS = DEFAULT_COLUMNS.filter(
  (col) => col !== "Shortage quantity",
);
const NUMERIC_COLUMNS = [
  "Orderable quantity (real-time)",
  "Sales amount on the last 30 days",
  "Sales in the last 30 days",
  "Shortage quantity",
];

function normalizeItemFields(item) {
  const normalized = { ...item };
  DEFAULT_COLUMNS.forEach((col) => {
    if (!(col in normalized)) normalized[col] = "";
  });
  return normalized;
}

function addShortage(items) {
  return items.map((item) => {
    const condition = String(item["Offer condition"] || "").trim().toUpperCase();
    if (condition && condition !== "NEW") {
      item["Shortage quantity"] = 0;
      return item;
    }
    const sales30 = Number(item["Sales in the last 30 days"] || 0);
    const inventory = Number(item["Orderable quantity (real-time)"] || 0);
    const daily = sales30 / 30;
    const safety = daily * 7;
    const shortage = inventory < safety ? Math.ceil(safety - inventory) : 0;
    item["Shortage quantity"] = shortage;
    return item;
  });
}

// 광고 지표는 더 이상 사용하지 않으므로 빈 함수로 남겨둔다
async function attachAdData(items, db) {
  return items;
}

// ✅ 목록 조회
router.get("/", async (req, res) => {
  const db = req.app.locals.db; // DB 인스턴스 재사용
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;
  const keyword = "";
  const brand = req.query.brand || "";
  const sortField =
    DEFAULT_COLUMNS.includes(req.query.sort) ? req.query.sort : "Product name";
  const sortOrder = req.query.order === "desc" ? -1 : 1;
  const shortageOnly = req.query.shortage === "1";
  try {
    const query = brand ? { "Product name": new RegExp(brand, "i") } : {};
    if (shortageOnly) query["Shortage quantity"] = { $gt: 0 };
    const [rows, total, reorderCount] = await Promise.all([
      db
        .collection("coupang")
        .find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("coupang").countDocuments(query),
      db.collection("coupang").countDocuments({
        ...(brand ? { "Product name": new RegExp(brand, "i") } : {}),
        "Shortage quantity": { $gt: 0 },
      }),
    ]);
    let result = rows.map((row) => {
      const newRow = normalizeItemFields({ ...row });
      if (typeof newRow["Option ID"] === "number") {
        newRow["Option ID"] = String(newRow["Option ID"]);
      }
      NUMERIC_COLUMNS.forEach((col) => {
        const num = Number(String(newRow[col]).replace(/,/g, ""));
        newRow[col] = isNaN(num) ? 0 : num;
      });
      return newRow;
    });

    const resultWithShortage = addShortage(result);
    const resultWithAds = await attachAdData(resultWithShortage, db);
    let selected = req.query.fields;
    if (selected && !Array.isArray(selected)) selected = selected.split(",");
    const fields =
      selected && selected.length > 0
        ? DEFAULT_COLUMNS.filter((col) => selected.includes(col))
        : DEFAULT_COLUMNS;

    const totalPage = Math.ceil(total / limit);
    const totalCount = total;
    const baseParams = new URLSearchParams();
    if (brand) baseParams.append("brand", brand);
    if (selected && selected.length > 0)
      selected.forEach((f) => baseParams.append("fields", f));
    if (shortageOnly) baseParams.append("shortage", "1");
    if (page > 1) baseParams.append("page", page);
    const baseQuery = baseParams.toString();
    const params = new URLSearchParams(baseQuery);
    if (sortField !== "Product name") params.append("sort", sortField);
    if (req.query.order) params.append("order", req.query.order);
    const queryString = params.toString();

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.json({
        rows: resultWithAds,
        fields,
        page,
        totalPage,
        totalCount,
        sortField,
        sortOrder,
        shortageOnly,
        reorderCount,
      });
    }

    res.render("coupang.ejs", {
      결과: resultWithAds,
      필드: fields,
      전체필드: DEFAULT_COLUMNS,
      성공메시지: null,
      한글,
      keyword,
      brand,
      brandOptions: BRANDS,
      현재페이지: page,
      전체페이지: totalPage,
      전체건수: totalCount,
      추가쿼리: queryString ? `&${queryString}` : "",
      기본쿼리: baseQuery,
      페이지크기: limit,
      sortField,
      sortOrder,
      shortageOnly,
      reorderCount,
    });
  } catch (err) {
    console.error("GET /coupang 오류:", err);
    res.status(500).send("❌ 재고 목록 불러오기 실패");
  }
});

// ✅ 엑셀 업로드
const { addJob } = require("../../lib/jobQueue");
router.post("/upload", upload.single("excelFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "파일이 없습니다." });
  }

  const jobId = addJob("coupang", req.file.path, req.app.locals.db);
  res.json({ jobId });
});

// ✅ 검색
router.get("/search", async (req, res) => {
  const db = req.app.locals.db;
  try {
    const keyword = req.query.keyword || "";
    const brand = req.query.brand || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const regex = keyword ? new RegExp(keyword, "i") : null;
    const brandRegex = brand ? new RegExp(brand, "i") : null;

    const conditions = [];
    if (regex) {
      conditions.push({
        $or: [
          { "Product name": regex },
          { "Option name": regex },
          { "Option ID": regex },
        ],
      });
    }
    if (brandRegex) {
      conditions.push({ "Product name": brandRegex });
    }

    const sortField =
      DEFAULT_COLUMNS.includes(req.query.sort) ? req.query.sort : "Product name";
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const shortageOnly = req.query.shortage === "1";

    const query = conditions.length > 0 ? { $and: conditions } : {};
    if (shortageOnly) query["Shortage quantity"] = { $gt: 0 };

    const reorderQuery = conditions.length > 0 ? { $and: conditions } : {};
    reorderQuery["Shortage quantity"] = { $gt: 0 };

    const [rows, total, reorderCount] = await Promise.all([
      db
        .collection("coupang")
        .find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("coupang").countDocuments(query),
      db.collection("coupang").countDocuments(reorderQuery),
    ]);
    let result = rows.map((row) => {
      const newRow = normalizeItemFields({ ...row });
      if (typeof newRow["Option ID"] === "number")
        newRow["Option ID"] = String(newRow["Option ID"]);
      NUMERIC_COLUMNS.forEach((col) => {
        const num = Number(String(newRow[col]).replace(/,/g, ""));
        newRow[col] = isNaN(num) ? 0 : num;
      });
      return newRow;
    });

    const resultWithShortage = addShortage(result);
    const resultWithAds = await attachAdData(resultWithShortage, db);
    let selected = req.query.fields;
    if (selected && !Array.isArray(selected)) selected = selected.split(",");
    const fields =
      selected && selected.length > 0
        ? DEFAULT_COLUMNS.filter((col) => selected.includes(col))
        : DEFAULT_COLUMNS;

    const totalPage = Math.ceil(total / limit);
    const totalCount = total;
    const baseParams = new URLSearchParams();
    if (keyword) baseParams.append("keyword", keyword);
    if (brand) baseParams.append("brand", brand);
    if (selected && selected.length > 0)
      selected.forEach((f) => baseParams.append("fields", f));
    if (shortageOnly) baseParams.append("shortage", "1");
    if (page > 1) baseParams.append("page", page);
    const baseQuery = baseParams.toString();
    const params = new URLSearchParams(baseQuery);
    if (sortField !== "Product name") params.append("sort", sortField);
    if (req.query.order) params.append("order", req.query.order);
    const queryString = params.toString();

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.json({
        rows: resultWithAds,
        fields,
        page,
        totalPage,
        totalCount,
        shortageOnly,
        reorderCount,
        sortField,
        sortOrder,
      });
    }

    res.render("coupang.ejs", {
      결과: resultWithAds,
      필드: fields,
      전체필드: DEFAULT_COLUMNS,
      성공메시지: null,
      한글,
      keyword,
      brand,
      brandOptions: BRANDS,
      현재페이지: page,
      전체페이지: totalPage,
      전체건수: totalCount,
      추가쿼리: queryString ? `&${queryString}` : "",
      기본쿼리: baseQuery,
      페이지크기: limit,
      shortageOnly,
      reorderCount,
      sortField,
      sortOrder,
    });
  } catch (err) {
    console.error("GET /coupang/search 오류:", err);
    res.status(500).send("❌ 검색 실패");
  }
});

// ✅ 전체 삭제
router.post("/delete-all", checkAuth, async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.collection("coupang").deleteMany({});
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      res.json({ status: "success" });
    } else {
      res.redirect("/coupang");
    }
  } catch (err) {
    console.error("POST /coupang/delete-all 오류:", err);
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      res.status(500).json({ status: "error" });
    } else {
      res.status(500).send("❌ 삭제 실패");
    }
  }
});

module.exports = router;

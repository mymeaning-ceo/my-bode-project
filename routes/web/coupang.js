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

const IMPORT_COLUMNS = DEFAULT_COLUMNS.filter(
  (col) => col !== "Shortage quantity",
);
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
  return items.map((item) => {
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
  const ads = await db.collection("coupangAdd").find().toArray();
  const adMap = {};
  ads.forEach((ad) => {
    const key = String(ad["광고집행 옵션ID"]);
    if (!key) return;
    const current = adMap[key];
    if (!current || (ad.날짜 && (!current.날짜 || ad.날짜 > current.날짜))) {
      adMap[key] = ad;
    }
  });
  return items.map((item) => {
    const ad = adMap[String(item["Option ID"])] || {};
    item["노출수"] = ad["노출수"] || 0;
    item["클릭수"] = ad["클릭수"] || 0;
    item["광고비"] = ad["광고비"] || 0;
    item["클릭률"] = ad["클릭률"] || "0.00";
    return item;
  });
}

// ✅ 목록 조회
router.get("/", async (req, res) => {
  const db = req.app.locals.db; // DB 인스턴스 재사용
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;
  const keyword = "";
  const brand = req.query.brand || "";
  try {
    const query = brand ? { "Product name": new RegExp(brand, "i") } : {};
    const [rows, total] = await Promise.all([
      db
        .collection("coupang")
        .find(query)
        .sort({ "Product name": 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("coupang").countDocuments(query),
    ]);
    let result = rows.map((row) => {
      const newRow = { ...row };
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
    const params = new URLSearchParams();
    if (brand) params.append("brand", brand);
    if (selected && selected.length > 0)
      selected.forEach((f) => params.append("fields", f));
    const queryString = params.toString();

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
      페이지크기: limit,
    });
  } catch (err) {
    console.error("GET /coupang 오류:", err);
    res.status(500).send("❌ 재고 목록 불러오기 실패");
  }
});

// ✅ 엑셀 업로드
router.post("/upload", upload.single("excelFile"), async (req, res) => {
  const db = req.app.locals.db;
  try {
    if (!req.file) {
      req.flash("error", "파일이 없습니다.");
      return res.redirect("/coupang");
    }

    const filePath = req.file.path;
    const data = parseCoupangExcel(filePath);

    const bulkOps = data.map((item) => ({
      updateOne: {
        filter: { "Option ID": item["Option ID"] },
        update: { $set: item },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) await db.collection("coupang").bulkWrite(bulkOps);
    fs.unlink(filePath, () => {});

    const resultWithShortage = addShortage(data);
    const resultWithAds = await attachAdData(resultWithShortage, db);

    res.render("coupang.ejs", {
      결과: resultWithAds,
      필드: DEFAULT_COLUMNS,
      전체필드: DEFAULT_COLUMNS,
      성공메시지: "✅ 엑셀 업로드 완료",
      한글,
      keyword: "",
      brand: "",
      brandOptions: BRANDS,
      현재페이지: 1,
      전체페이지: 1,
      전체건수: resultWithAds.length,
      추가쿼리: "",
      페이지크기: limit,
    });
  } catch (err) {
    console.error("POST /coupang/upload 오류:", err);
    res.status(500).send("❌ 업로드 실패");
  }
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

    const query = conditions.length > 0 ? { $and: conditions } : {};
    const [rows, total] = await Promise.all([
      db
        .collection("coupang")
        .find(query)
        .sort({ "Product name": 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("coupang").countDocuments(query),
    ]);
    let result = rows.map((row) => {
      const newRow = { ...row };
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
    const params = new URLSearchParams();
    if (keyword) params.append("keyword", keyword);
    if (brand) params.append("brand", brand);
    if (selected && selected.length > 0)
      selected.forEach((f) => params.append("fields", f));
    const queryString = params.toString();

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
      페이지크기: limit,
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
    res.redirect("/coupang");
  } catch (err) {
    console.error("POST /coupang/delete-all 오류:", err);
    res.status(500).send("❌ 삭제 실패");
  }
});

module.exports = router;

// controllers/stockController.js
const path = require("path");
const multer = require("multer");
const { spawn } = require("child_process");
const { addJob } = require("../lib/jobQueue");
const asyncHandler = require("../middlewares/asyncHandler"); // ★ 상단에 한 번만

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `excel_${Date.now()}${path.extname(file.originalname)}`),
});
exports.upload = multer({ storage }).single("excelFile");

// Render stock page
exports.renderStockPage = asyncHandler(async (req, res) => {
  res.render("stock");
});

// DataTables API (server-side pagination)
exports.getStockData = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  // DataTables parameters
  const start = parseInt(req.query.start, 10) || 0;
  const length = parseInt(req.query.length, 10) || 50;
  const draw = parseInt(req.query.draw, 10) || 1;

  // 검색 파라미터
  const itemCode = req.query.item_code || "";
  const color = req.query.color || "";
  const size = req.query.size || "";

  const query = {};
  if (itemCode) query.item_code = { $regex: itemCode, $options: "i" };
  if (color) query.color = { $regex: color, $options: "i" };
  if (size) query.size = { $regex: size, $options: "i" };

  // 정렬 파라미터
  const columns = {
    1: "item_code",
    2: "item_name",
    3: "color",
    4: "size",
    5: "qty",
    6: "allocation",
    7: "uploadedBy",
    8: "createdAt",
  };
  const orderCol = columns[req.query["order[0][column]"]] || "item_code";
  const orderDir = req.query["order[0][dir]"] === "desc" ? -1 : 1;
  const sortOption = { [orderCol]: orderDir };

  const [rows, total] = await Promise.all([
    db
      .collection("stock")
      .find(query)
      .sort(sortOption)
      .skip(start)
      .limit(length)
      .toArray(),
    db.collection("stock").countDocuments(query),
  ]);

  res.json({
    draw,
    recordsTotal: total,
    recordsFiltered: total,
    data: rows,
  });
});

// Excel upload API
exports.uploadExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "파일이 없습니다." });
  }

  const jobId = addJob("stock", req.file.path, req.app.locals.db);
  res.json({ jobId });
});

// Excel upload API (JSON response)
exports.uploadExcelApi = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "파일이 없습니다." });
  }

  const jobId = addJob("stock", req.file.path, req.app.locals.db);
  res.json({ jobId });
});

const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const asyncHandler = require('../middlewares/asyncHandler');

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `excel_${Date.now()}${path.extname(file.originalname)}`)
});
exports.upload = multer({ storage }).single('excelFile');

// 상품명 정규화
function normalizeProductName(fullName = '') {
  const idx = fullName.indexOf(',{"');
  return idx >= 0 ? fullName.slice(0, idx).trim() : fullName;
}

// Render page
exports.renderPage = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const mode = req.query.mode === 'summary' ? 'summary' : 'detail';

  const page = parseInt(req.query.page, 10) || 1;
  const limit = 50;
  const keyword = req.query.search || '';
  const skip = (page - 1) * limit;

  let list = [];
  let total = 0;
  let totalPages = 1;

  if (mode === 'summary') {
    const adList = await db.collection('coupangAdd').find().toArray();
    const grouped = {};

    adList.forEach((ad) => {
      const clean = normalizeProductName(ad['광고집행 상품명'] || '');
      if (!grouped[clean]) {
        grouped[clean] = {
          productName: clean,
          impressions: 0,
          clicks: 0,
          adCost: 0,
          optionIds: [],
        };
      }

      grouped[clean].impressions += Number(ad['노출수'] || 0);
      grouped[clean].clicks += Number(ad['클릭수'] || 0);
      grouped[clean].adCost += Number(ad['광고비'] || 0);
      if (ad['광고집행 옵션ID']) grouped[clean].optionIds.push(String(ad['광고집행 옵션ID']));
    });

    list = Object.values(grouped).map((g) => {
      g.ctr = g.impressions > 0 ? ((g.clicks / g.impressions) * 100).toFixed(2) : '0.00';
      return g;
    });

    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      list = list.filter(
        (item) => regex.test(item.productName) || item.optionIds.some((id) => regex.test(id))
      );
    }

    total = list.length;
    totalPages = Math.ceil(total / limit) || 1;
    list = list.slice(skip, skip + limit);
  }

  res.render('coupangAdd', {
    mode,
    list,
    page,
    totalPages,
    search: keyword,
    total,
  });
});

// DataTables API
exports.getData = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const start = parseInt(req.query.start, 10) || 0;
  const length = parseInt(req.query.length, 10) || 50;
  const draw = parseInt(req.query.draw, 10) || 1;

  // 기본 정렬 기준
  let sort = { _id: -1 };

  // DataTables에서 전달된 정렬 정보 적용
  if (
    req.query.order && Array.isArray(req.query.order) &&
    req.query.columns && Array.isArray(req.query.columns)
  ) {
    const { column, dir } = req.query.order[0];
    const colIdx = parseInt(column, 10);
    const columnInfo = req.query.columns[colIdx];
    if (columnInfo && columnInfo.data) {
      sort = { [columnInfo.data]: dir === 'asc' ? 1 : -1 };
    }
  }

  const [rows, total] = await Promise.all([
    db
      .collection('coupangAdd')
      .find()
      .sort(sort)
      .skip(start)
      .limit(length)
      .toArray(),
    db.collection('coupangAdd').countDocuments()
  ]);

  res.json({
    draw,
    recordsTotal: total,
    recordsFiltered: total,
    data: rows
  });
});

// Excel upload for web route
exports.uploadExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).send('❌ 파일이 업로드되지 않았습니다.');
  }
  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const raw = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const numericFields = ['노출수', '클릭수', '광고비', '클릭률'];
  const data = raw.map(row => {
    numericFields.forEach(f => {
      if (row[f] !== undefined && row[f] !== null && row[f] !== '') {
        const num = Number(String(row[f]).replace(/[^0-9.-]/g, ''));
        row[f] = f === '클릭률' ? Number(num.toFixed(2)) : num;
      }
    });
    return row;
  });

  const db = req.app.locals.db;
  await db.collection('coupangAdd').deleteMany({});
  if (data.length > 0) await db.collection('coupangAdd').insertMany(data);

  fs.unlink(filePath, () => {});
  if (req.flash) req.flash('성공메시지', '✅ 업로드 완료');
  res.redirect('/coupang/add');
});

// Excel upload API
exports.uploadExcelApi = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: '파일이 없습니다.' });
  }
  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const raw = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const numericFields = ['노출수', '클릭수', '광고비', '클릭률'];
  const data = raw.map(row => {
    numericFields.forEach(f => {
      if (row[f] !== undefined && row[f] !== null && row[f] !== '') {
        const num = Number(String(row[f]).replace(/[^0-9.-]/g, ''));
        row[f] = f === '클릭률' ? Number(num.toFixed(2)) : num;
      }
    });
    return row;
  });

  const db = req.app.locals.db;
  await db.collection('coupangAdd').deleteMany({});
  if (data.length > 0) await db.collection('coupangAdd').insertMany(data);

  fs.unlink(filePath, () => {});
  res.json({ status: 'success' });
});

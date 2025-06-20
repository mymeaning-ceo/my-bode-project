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

// 상품명 정규화 (쉼표 기준 앞부분만)
function normalizeProductName(fullName = '') {
  const idx = fullName.indexOf(',');
  return idx >= 0 ? fullName.slice(0, idx).trim() : fullName;
}

// Render page
exports.renderPage = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const mode = req.query.mode === 'summary' ? 'summary' : 'detail';

  const search = req.query.search || '';
  const brand = req.query.brand || '';
  const sortField = req.query.sort || 'clicks';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;

  let list = [];

  if (mode === 'summary') {
    const rawData = await db.collection('coupangAdd').find().toArray();

    const cleaned = rawData.map((item) => {
      const full = item['광고집행 상품명'] || '';
      const trimmed = full.includes(',') ? full.split(',')[0].trim() : full;
      return { ...item, trimmedName: trimmed };
    });

    const grouped = {};
    cleaned.forEach((item) => {
      const key = item.trimmedName;
      if (!grouped[key]) {
        grouped[key] = { name: key, impressions: 0, clicks: 0, adCost: 0 };
      }
      grouped[key].impressions += Number(item['노출수'] || 0);
      grouped[key].clicks += Number(item['클릭수'] || 0);
      grouped[key].adCost += Number(item['광고비'] || 0);
    });

    list = Object.values(grouped).map((g, i) => ({
      no: i + 1,
      ...g,
      ctr: g.impressions > 0 ? ((g.clicks / g.impressions) * 100).toFixed(2) : '0.00',
    }));

    if (brand) {
      list = list.filter((item) => item.name.includes(brand));
    }

    if (search) {
      list = list.filter((item) => item.name.includes(search));
    }

    list.sort((a, b) => {
      return sortOrder * ((+b[sortField] || 0) - (+a[sortField] || 0));
    });

    return res.render('coupang-add-summary', {
      list,
      search,
      brand,
      sortField,
      sortOrder,
    });
  }

  // detail 모드 화면
  res.render('coupangAdd', {
    mode,
  });
});

// DataTables API
exports.getData = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const start = parseInt(req.query.start, 10) || 0;
  const length = parseInt(req.query.length, 10) || 50;
  const draw = parseInt(req.query.draw, 10) || 1;
  const keyword = req.query.search || '';

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

  let rows = await db.collection('coupangAdd').find().sort(sort).toArray();
  const total = rows.length;

  if (keyword) {
    const regex = new RegExp(keyword, 'i');
    rows = rows.filter(
      (item) =>
        regex.test(item['광고집행 상품명'] || '') ||
        regex.test(String(item['광고집행 옵션ID'] || ''))
    );
  }

  const recordsFiltered = rows.length;
  rows = rows.slice(start, start + length);

  res.json({
    draw,
    recordsTotal: total,
    recordsFiltered,
    data: rows,
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

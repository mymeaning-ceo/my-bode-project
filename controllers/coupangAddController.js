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

// Render page
exports.renderPage = asyncHandler(async (req, res) => {
  res.render('coupangAdd');
});

// DataTables API
exports.getData = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const start = parseInt(req.query.start, 10) || 0;
  const length = parseInt(req.query.length, 10) || 50;
  const draw = parseInt(req.query.draw, 10) || 1;

  const [rows, total] = await Promise.all([
    db
      .collection('coupangAdd')
      .find()
      .sort({ _id: -1 })
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

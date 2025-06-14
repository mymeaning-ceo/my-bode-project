const path = require('path');
const multer = require('multer');
const { spawn } = require('child_process');
const asyncHandler = require('../middlewares/asyncHandler');

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `excel_${Date.now()}${path.extname(file.originalname)}`)
});
exports.upload = multer({ storage }).single('excelFile');

// Render stock page
exports.renderStockPage = asyncHandler(async (req, res) => {
  res.render('stock');
});

// DataTables API
exports.getStockData = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;
  const keyword = req.query.keyword || '';

  const query = keyword
    ? {
        $or: [
          { item_name: { $regex: keyword, $options: 'i' } },
          { item_code: { $regex: keyword, $options: 'i' } }
        ]
      }
    : {};

  const [rows, total] = await Promise.all([
    db.collection('stock')
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection('stock').countDocuments(query)
  ]);

  res.json({ data: rows, total });
});

// Excel upload API
exports.uploadExcel = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).send('파일이 없습니다.');

  const python = spawn('python3', [
    'scripts/excel_to_mongo.py',
    path.resolve(req.file.path),
    process.env.DB_NAME,
    'stock'
  ]);

  python.on('close', async (code) => {
    if (code !== 0) return res.status(500).send('엑셀 처리 실패');

    const db = req.app.locals.db;
    await db.collection('stock').updateMany({}, { $set: { createdAt: new Date() } });
    res.json({ message: '업로드 완료' });
  });

  setTimeout(() => {
    if (!python.killed) python.kill('SIGTERM');
  }, 60_000);
});

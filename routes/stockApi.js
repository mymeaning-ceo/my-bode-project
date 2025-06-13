// routes/stockApi.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');

// ────────────────────────────
// 1) Multer 설정
// ────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName =
      'excel_' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('엑셀 파일만 업로드 가능합니다.'));
  }
});

// ────────────────────────────
// 2) GET /api/stock  (목록/검색/페이지네이션)
// ────────────────────────────
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip  = (page - 1) * limit;
  const keyword = req.query.keyword || '';

  const query = keyword
    ? {
        $or: [
          { item_name: { $regex: keyword, $options: 'i' } },
          { item_code: { $regex: keyword, $options: 'i' } }
        ]
      }
    : {};

  const total = await db.collection('stock').countDocuments(query);
  const data  = await db
    .collection('stock')
    .find(query)
    .skip(skip)
    .limit(limit)
    .toArray();

  res.json({ total, data });
});

// ────────────────────────────
// 3) POST /api/stock/upload  (엑셀 업로드)
// ────────────────────────────
router.post('/upload', upload.single('excelFile'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일 없음' });

  const filePath = path.resolve(req.file.path);
  const python = spawn(
    'python3',
    ['scripts/excel_to_mongo.py', filePath, 'forum', 'stock'],
    { shell: true }
  );

  python.on('close', code => {
    if (code === 0) return res.json({ ok: true });
    res.status(500).json({ error: '엑셀 처리 실패' });
  });

  // 10분 타임아웃
  setTimeout(() => python.kill('SIGTERM'), 600000);
});

// ────────────────────────────
// 4) DELETE /api/stock  (전체 삭제)
// ────────────────────────────
router.delete('/', async (req, res) => {
  const db = req.app.locals.db;
  await db.collection('stock').deleteMany({});
  res.json({ ok: true });
});

router.post(
    '/upload',
    upload.single('excelFile'),
    (req, res, next) => {
      // 기존 로직...
      // python.on('close', ...) 내부에서 next(err) 호출 가능
    },
    // ← 에러 핸들러 (4개의 인자 필요)
    (err, req, res, next) => {
      console.error('업로드 라우트 에러:', err);
      res.status(500).json({ error: err.message || '업로드 실패' });
    }
  );

module.exports = router;
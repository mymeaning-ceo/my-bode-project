const express = require('express');
const router = express.Router();
const multer = require('multer'); // 📌 파일 업로드 처리를 위한 multer
const path = require('path');
const { spawn } = require('child_process'); // 📌 Python 스크립트 실행을 위한 spawn

// 📁 multer 설정: uploads/ 폴더에 엑셀 파일 저장
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `excel_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });


// 📦 /stock 기본 페이지
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  if (!db) return res.status(500).send('❌ DB 연결이 완료되지 않았습니다.');

  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;

  try {
    const totalCount = await db.collection('stock').countDocuments();
    const 결과 = await db.collection('stock').find().skip(skip).limit(limit).toArray();
    const 필드 = 결과.length > 0 ? Object.keys(결과[0]) : [];

    res.render('stock', {
      결과,
      필드: 필드.slice(0, 50), // 컬럼 최대 50개
      현재페이지: page,
      전체페이지수: Math.ceil(totalCount / limit),
      검색어: '',
      성공메시지: req.flash ? req.flash('성공메시지') : ''
    });
  } catch (err) {
    console.error('❌ /stock 오류:', err);
    res.status(500).send('서버 오류 발생');
  }
});

// 🔍 /stock/search 검색 기능
router.get('/search', async (req, res) => {
  const db = req.app.locals.db;
  if (!db) return res.status(500).send('❌ DB 연결이 완료되지 않았습니다.');

  const keyword = req.query.keyword || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;

  try {
    const query = {
      $or: [
        { 품명: { $regex: keyword, $options: 'i' } },
        { 품목번: { $regex: keyword, $options: 'i' } }
      ]
    };

    const totalCount = await db.collection('stock').countDocuments(query);
    const 결과 = await db.collection('stock').find(query).skip(skip).limit(limit).toArray();
    const 필드 = 결과.length > 0 ? Object.keys(결과[0]) : [];

    res.render('stock', {
      결과,
      필드: 필드.slice(0, 50),
      현재페이지: page,
      전체페이지수: Math.ceil(totalCount / limit),
      검색어: keyword,
      성공메시지: req.flash ? req.flash('성공메시지') : ''
    });
  } catch (err) {
    console.error('❌ /stock/search 오류:', err);
    res.status(500).send('서버 오류 발생');
  }
});

// 🔥 전체 삭제 라우터
router.post('/delete-all', async (req, res) => {
  const db = req.app.locals.db;
  if (!db) return res.status(500).send('❌ DB 연결이 완료되지 않았습니다.');

  try {
    await db.collection('stock').deleteMany({});
    if (req.flash) req.flash('성공메시지', '✅ 전체 삭제가 완료되었습니다.');
    res.redirect('/stock');
  } catch (err) {
    console.error('❌ /stock/delete-all 오류:', err);
    res.status(500).send('삭제 실패');
  }
});

// 📥 엑셀 업로드 라우터
router.post('/upload', upload.single('excelFile'), (req, res) => {
  console.log('✅ POST /stock/upload 라우터 진입'); // 이 줄 추가
  const filePath = path.resolve(req.file.path); // 업로드된 파일 경로
  const dbName = 'forum';
  const collectionName = 'stock';

  const python = spawn('python', [
    'scripts/excel_to_mongo.py',
    filePath,
    dbName,
    collectionName
  ]);

  // 로그 출력 (디버깅용)
  python.stdout.on('data', data => console.log(`📤 Python STDOUT: ${data}`));
  python.stderr.on('data', data => console.error(`⚠️ Python STDERR: ${data}`));

  python.on('close', code => {
    if (code === 0) {
      if (req.flash) req.flash('성공메시지', '✅ 엑셀 업로드가 완료되었습니다.');
      res.redirect('/stock');
    } else {
      res.status(500).send('❌ 엑셀 처리 중 오류 발생');
    }
  });
});


module.exports = router;

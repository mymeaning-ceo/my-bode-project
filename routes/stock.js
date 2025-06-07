<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { checkLogin } = require('../middlewares/auth');

// 커스텀 엑셀 파싱 설정
const STOCK_START_ROW = parseInt(process.env.STOCK_START_ROW || '0');
const STOCK_COLUMNS = process.env.STOCK_COLUMNS
  ? process.env.STOCK_COLUMNS.split(',').map(v => v.trim())
  : null; // null이면 모든 컬럼 사용

let db;
const connectDB = require('../database');
connectDB.then(client => {
  db = client.db('forum');
});

// ✅ uploads 폴더 자동 생성
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// 업로드 설정
const upload = multer({ dest: uploadsDir });

/**
 * 기본 재고 페이지
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.collection('stock').find().sort({ 상품명: 1 }).toArray();
    const fields = STOCK_COLUMNS || (result[0] ? Object.keys(result[0]).filter(k => k !== '_id') : []);
    res.render('stock.ejs', { 결과: result, 필드: fields, 성공메시지: null });
  } catch (err) {
    console.error('목록 조회 오류:', err);
    res.status(500).send('❌ 재고 목록 불러오기 실패');
  }
});

/**
 * 엑셀 업로드 처리
 */
router.post('/upload', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('❌ 파일이 업로드되지 않았습니다.');
    }

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    let data = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      { range: STOCK_START_ROW }
    );

    if (STOCK_COLUMNS && STOCK_COLUMNS.length > 0) {
      data = data.map(row => {
        const obj = {};
        STOCK_COLUMNS.forEach(col => {
          obj[col] = row[col];
        });
        return obj;
      });
    }

    if (data.length === 0) {
      return res.status(400).send('❌ 엑셀 파일이 비어 있습니다.');
    }

    await db.collection('stock').insertMany(data);

    fs.unlink(filePath, err => {
      if (err) console.error('파일 삭제 실패:', err);
    });

    // 업로드 후 재고 목록 + 메시지 전달
    const resultArray = await db.collection('stock').find().sort({ 상품명: 1 }).toArray();
    const fields = STOCK_COLUMNS || (resultArray[0] ? Object.keys(resultArray[0]).filter(k => k !== '_id') : []);
    res.render('stock.ejs', {
      결과: resultArray,
      필드: fields,
      성공메시지: '✅ 엑셀 업로드가 완료되었습니다!'
    });

  } catch (err) {
    console.error('엑셀 업로드 오류:', err);
    res.status(500).send('❌ 업로드 실패');
  }
});

/**
 * 검색 기능
 */
router.get('/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const regex = new RegExp(keyword, 'i');

    const result = await db.collection('stock').find({
      $or: [
        { 상품명: regex },
        { 상품코드: regex }
      ]
    }).toArray();

    const fields = STOCK_COLUMNS || (result[0] ? Object.keys(result[0]).filter(k => k !== '_id') : []);
    res.render('stock.ejs', { 결과: result, 필드: fields, 성공메시지: null });
  } catch (err) {
    console.error('검색 오류:', err);
    res.status(500).send('❌ 검색 실패');
  }
});

/**
 * 모든 재고 데이터 삭제
 */
router.post('/delete-all', checkLogin, async (req, res) => {
  try {
    const result = await db.collection('stock').deleteMany({});
    console.log('🗑 삭제된 문서 수:', result.deletedCount);
    res.redirect('/stock');
  } catch (err) {
    console.error('❌ 데이터 초기화 오류:', err);
    res.status(500).send('❌ 삭제 실패');
  }
});

module.exports = router;
=======
const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { checkLogin } = require('../middlewares/auth');

// 커스텀 엑셀 파싱 설정
const STOCK_START_ROW = parseInt(process.env.STOCK_START_ROW || '0');
const STOCK_COLUMNS = process.env.STOCK_COLUMNS
  ? process.env.STOCK_COLUMNS.split(',').map(v => v.trim())
  : null; // null이면 모든 컬럼 사용

let db;
const connectDB = require('../database');
connectDB.then(client => {
  db = client.db('forum');
});

// ✅ uploads 폴더 자동 생성
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// 업로드 설정
const upload = multer({ dest: uploadsDir });

/**
 * 기본 재고 페이지
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.collection('stock').find().sort({ 상품명: 1 }).toArray();
    const fields = STOCK_COLUMNS || (result[0] ? Object.keys(result[0]).filter(k => k !== '_id') : []);
    res.render('stock.ejs', { 결과: result, 필드: fields, 성공메시지: null });
  } catch (err) {
    console.error('목록 조회 오류:', err);
    res.status(500).send('❌ 재고 목록 불러오기 실패');
  }
});

/**
 * 엑셀 업로드 처리
 */
router.post('/upload', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('❌ 파일이 업로드되지 않았습니다.');
    }

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    let data = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      { range: STOCK_START_ROW }
    );

    if (STOCK_COLUMNS && STOCK_COLUMNS.length > 0) {
      data = data.map(row => {
        const obj = {};
        STOCK_COLUMNS.forEach(col => {
          obj[col] = row[col];
        });
        return obj;
      });
    }

    if (data.length === 0) {
      return res.status(400).send('❌ 엑셀 파일이 비어 있습니다.');
    }

    await db.collection('stock').insertMany(data);

    fs.unlink(filePath, err => {
      if (err) console.error('파일 삭제 실패:', err);
    });

    // 업로드 후 재고 목록 + 메시지 전달
    const resultArray = await db.collection('stock').find().sort({ 상품명: 1 }).toArray();
    const fields = STOCK_COLUMNS || (resultArray[0] ? Object.keys(resultArray[0]).filter(k => k !== '_id') : []);
    res.render('stock.ejs', {
      결과: resultArray,
      필드: fields,
      성공메시지: '✅ 엑셀 업로드가 완료되었습니다!'
    });

  } catch (err) {
    console.error('엑셀 업로드 오류:', err);
    res.status(500).send('❌ 업로드 실패');
  }
});

/**
 * 검색 기능
 */
router.get('/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const regex = new RegExp(keyword, 'i');

    const result = await db.collection('stock').find({
      $or: [
        { 상품명: regex },
        { 상품코드: regex }
      ]
    }).toArray();

    const fields = STOCK_COLUMNS || (result[0] ? Object.keys(result[0]).filter(k => k !== '_id') : []);
    res.render('stock.ejs', { 결과: result, 필드: fields, 성공메시지: null });
  } catch (err) {
    console.error('검색 오류:', err);
    res.status(500).send('❌ 검색 실패');
  }
});

/**
 * 모든 재고 데이터 삭제
 */
router.post('/delete-all', checkLogin, async (req, res) => {
  try {
    const result = await db.collection('stock').deleteMany({});
    console.log('🗑 삭제된 문서 수:', result.deletedCount);
    res.redirect('/stock');
  } catch (err) {
    console.error('❌ 데이터 초기화 오류:', err);
    res.status(500).send('❌ 삭제 실패');
  }
});

module.exports = router;
>>>>>>> e64b824c86d54036124f4af898c95dcecdd5cd57

const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { checkLogin } = require('../middlewares/auth');

// 커스텀 엑셀 파싱 설정
const COUPANG_START_ROW = parseInt(process.env.COUPANG_START_ROW || '0');
const COUPANG_COLUMNS = process.env.COUPANG_COLUMNS
  ? process.env.COUPANG_COLUMNS.split(',').map(v => v.trim())
  : [
      'Option ID',
      'Product name',
      'Option name',
      'Orderable quantity (real-time)',
      'Recent sales (Excluding bundle sales) Last 30 days',
      'Recent sales quantity Last 30 days'
    ];

let db;
const connectDB = require('../database');
connectDB.then(client => {
  db = client.db('forum');
});

// uploads directory ensure
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const upload = multer({ dest: uploadsDir });

// --- CoupangAdd configuration ---
const COUPANG_ADD_START_ROW = parseInt(process.env.COUPANG_ADD_START_ROW || '0');
const COUPANG_ADD_COLUMNS = process.env.COUPANG_ADD_COLUMNS
  ? process.env.COUPANG_ADD_COLUMNS.split(',').map(v => v.trim())
  : ['Option ID', '매출금액', '광고비용 소진금액'];

// default inventory page
router.get('/', async (req, res) => {
  try {
    const result = await db.collection('coupang').find().sort({ 'Product name': 1 }).toArray();
    const fields = COUPANG_COLUMNS || (result[0] ? Object.keys(result[0]).filter(k => k !== '_id') : []);
    res.render('coupang.ejs', { 결과: result, 필드: fields, 성공메시지: null });
  } catch (err) {
    console.error('목록 조회 오류:', err);
    res.status(500).send('❌ 재고 목록 불러오기 실패');
  }
});

// excel upload
router.post('/upload', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('❌ 파일이 업로드되지 않았습니다.');
    }

    const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json(
    workbook.Sheets[sheetName],
    { range: COUPANG_START_ROW }
  );

    if (rawData.length === 0) {
      return res.status(400).send('❌ 엑셀 파일이 비어 있습니다.');
    }

  // pick needed fields
  const data = rawData.map(row => {
    const obj = {};
    COUPANG_COLUMNS.forEach(col => {
      obj[col] = row[col];
    });
    return obj;
  });

    const bulkOps = data.map(item => ({
      updateOne: {
        filter: { 'Option ID': item['Option ID'] },
        update: { $set: item },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await db.collection('coupang').bulkWrite(bulkOps);
    }

    fs.unlink(filePath, err => {
      if (err) console.error('파일 삭제 실패:', err);
    });

    const resultArray = await db.collection('coupang').find().sort({ 'Product name': 1 }).toArray();
    const fields = COUPANG_COLUMNS || (resultArray[0] ? Object.keys(resultArray[0]).filter(k => k !== '_id') : []);
    res.render('coupang.ejs', {
      결과: resultArray,
      필드: fields,
      성공메시지: '✅ 엑셀 업로드가 완료되었습니다!'
    });
  } catch (err) {
    console.error('엑셀 업로드 오류:', err);
    res.status(500).send('❌ 업로드 실패');
  }
});

// search functionality
router.get('/search', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const regex = new RegExp(keyword, 'i');

    const result = await db.collection('coupang').find({
      $or: [
        { 'Product name': regex },
        { 'Option name': regex },
        { 'Option ID': regex }
      ]
    }).toArray();

    const fields = COUPANG_COLUMNS || (result[0] ? Object.keys(result[0]).filter(k => k !== '_id') : []);
    res.render('coupang.ejs', { 결과: result, 필드: fields, 성공메시지: null });
  } catch (err) {
    console.error('검색 오류:', err);
    res.status(500).send('❌ 검색 실패');
  }
});

// delete all data
router.post('/delete-all', checkLogin, async (req, res) => {
  try {
    const result = await db.collection('coupang').deleteMany({});
    console.log('🗑 삭제된 문서 수:', result.deletedCount);
    res.redirect('/coupang');
  } catch (err) {
    console.error('❌ 데이터 초기화 오류:', err);
    res.status(500).send('❌ 삭제 실패');
  }
});

// ====== CoupangAdd ======
router.get('/add', async (req, res) => {
  try {
    const result = await db.collection('coupangAdd')
      .find()
      .sort({ 'Option ID': 1 })
      .toArray();
    const fields = COUPANG_ADD_COLUMNS || (result[0] ? Object.keys(result[0]).filter(k => k !== '_id') : []);
    res.render('coupangAdd.ejs', { 결과: result, 필드: fields, 성공메시지: null });
  } catch (err) {
    console.error('목록 조회 오류:', err);
    res.status(500).send('❌ 목록 불러오기 실패');
  }
});

router.post('/add/upload', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('❌ 파일이 업로드되지 않았습니다.');
    }

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      { range: COUPANG_ADD_START_ROW }
    );

    if (rawData.length === 0) {
      return res.status(400).send('❌ 엑셀 파일이 비어 있습니다.');
    }

    const data = rawData.map(row => {
      const obj = {};
      COUPANG_ADD_COLUMNS.forEach(col => {
        obj[col] = row[col];
      });
      return obj;
    });

    const bulkOps = data.map(item => ({
      updateOne: {
        filter: { 'Option ID': item['Option ID'] },
        update: { $set: item },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await db.collection('coupangAdd').bulkWrite(bulkOps);
    }

    fs.unlink(filePath, err => {
      if (err) console.error('파일 삭제 실패:', err);
    });

    const resultArray = await db.collection('coupangAdd')
      .find()
      .sort({ 'Option ID': 1 })
      .toArray();
    const fields = COUPANG_ADD_COLUMNS || (resultArray[0] ? Object.keys(resultArray[0]).filter(k => k !== '_id') : []);
    res.render('coupangAdd.ejs', {
      결과: resultArray,
      필드: fields,
      성공메시지: '✅ 엑셀 업로드가 완료되었습니다!'
    });
  } catch (err) {
    console.error('엑셀 업로드 오류:', err);
    res.status(500).send('❌ 업로드 실패');
  }
});

router.post('/add/delete-all', checkLogin, async (req, res) => {
  try {
    const result = await db.collection('coupangAdd').deleteMany({});
    console.log('🗑 삭제된 문서 수:', result.deletedCount);
    res.redirect('/coupang/add');
  } catch (err) {
    console.error('❌ 데이터 초기화 오류:', err);
    res.status(500).send('❌ 삭제 실패');
  }
});

module.exports = router;
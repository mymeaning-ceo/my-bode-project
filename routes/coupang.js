// routes/coupang.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { checkLogin } = require('../middlewares/auth');

let db;
const connectDB = require('../database');
connectDB.then(client => {
  db = client.db('forum');
});

// 업로드 디렉토리 준비
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

// 한글 매핑
const 한글 = {
  'Option ID': '옵션ID',
  'Product name': '상품명',
  'Option name': '옵션명',
  'Orderable quantity (real-time)': '주문 가능 수량(실시간)',
  'Recent sales (Excluding bundle sales) Last 30 days': '최근 30일 판매금액',
  'Recent sales quantity Last 30 days': '최근 30일 판매량',
  'Ad spend (30d)': '광고비용 소진금액',
  'Expected stock': '예상 입고 수량'
};

const DEFAULT_COLUMNS = Object.keys(한글);

// 공통 필드 추출 함수 (중복 제거)
function getAllFields(resultArray) {
  return resultArray[0] ? Object.keys(resultArray[0]).filter(k => k !== '_id') : [];
}

// 기본 목록 페이지
router.get('/', async (req, res) => {
  try {
    const result = await db.collection('coupang').find().sort({ 'Product name': 1 }).toArray();
    const allFields = getAllFields(result);
    let selected = req.query.fields;
    if (selected && !Array.isArray(selected)) selected = selected.split(',');
    const fields = selected && selected.length > 0
      ? selected.filter(f => allFields.includes(f))
      : (DEFAULT_COLUMNS || allFields);
    res.render('coupang.ejs', { 결과: result, 필드: fields, 전체필드: allFields, 성공메시지: null, 한글 });
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ 재고 목록 불러오기 실패');
  }
});

// 엑셀 업로드
router.post('/upload', upload.single('excelFile'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const headerRow = sheetData[0]; // 첫 번째 행을 헤더로 사용
    const dataRows = sheetData.slice(1);

    const indexMap = {};
    DEFAULT_COLUMNS.forEach(key => {
      const idx = headerRow.findIndex(col => col && col.trim() === key);
      if (idx !== -1) indexMap[key] = idx;
    });

    const data = dataRows.map(row => {
      const obj = {};
      for (const col of DEFAULT_COLUMNS) {
        obj[col] = row[indexMap[col]] ?? '';
      }
      return obj;
    });

    const bulkOps = data.map(item => ({
      updateOne: {
        filter: { 'Option ID': item['Option ID'] },
        update: { $set: item },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) await db.collection('coupang').bulkWrite(bulkOps);
    fs.unlink(filePath, () => {});

    const resultArray = await db.collection('coupang').find().sort({ 'Product name': 1 }).toArray();
    const allFields = getAllFields(resultArray);
    res.render('coupang.ejs', { 결과: resultArray, 필드: allFields, 전체필드: allFields, 성공메시지: '✅ 업로드 완료', 한글 });
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ 업로드 실패');
  }
});

// 검색
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
    const allFields = getAllFields(result);
    const selected = req.query.fields ? (Array.isArray(req.query.fields) ? req.query.fields : req.query.fields.split(',')) : DEFAULT_COLUMNS;
    const fields = selected.filter(f => allFields.includes(f));
    res.render('coupang.ejs', { 결과: result, 필드: fields.length ? fields : allFields, 전체필드: allFields, 성공메시지: null, 한글 });
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ 검색 실패');
  }
});

// 전체 삭제
router.post('/delete-all', checkLogin, async (req, res) => {
  try {
    await db.collection('coupang').deleteMany({});
    res.redirect('/coupang');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ 삭제 실패');
  }
});

module.exports = router;

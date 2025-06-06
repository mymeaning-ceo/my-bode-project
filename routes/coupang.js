const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { checkLogin } = require('../middlewares/auth'); // 경로 반드시 확인!

let db;
const connectDB = require('../database'); // 경로 반드시 확인!
connectDB.then(client => {
  db = client.db('forum'); // 'forum' DB명 확인
});

// 업로드 디렉토리
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

// 한글 매핑 및 순서
const 한글 = {
  'Option ID': '옵션ID',
  'Product name': '상품명',
  'Option name': '옵션명',
  'Orderable quantity (real-time)': '재고량',
  'Sales amount on the last 30 days': '30일 판매금액',
  'Sales in the last 30 days': '30일 판매량',
  'Shortage quantity': '부족재고량'
};
const DEFAULT_COLUMNS = [
  'Option ID',
  'Product name',
  'Option name',
  'Orderable quantity (real-time)',
  'Sales amount on the last 30 days',
  'Sales in the last 30 days',
  'Shortage quantity'
];

const IMPORT_COLUMNS = DEFAULT_COLUMNS.filter(col => col !== 'Shortage quantity');

const NUMERIC_COLUMNS = [
  'Orderable quantity (real-time)',
  'Sales amount on the last 30 days',
  'Sales in the last 30 days',
  'Shortage quantity'
];

function addShortage(items) {
  return items.map(item => {
    const sales30 = Number(item['Sales in the last 30 days'] || 0);
    const inventory = Number(item['Orderable quantity (real-time)'] || 0);
    const daily = sales30 / 30;
    const safety = daily * 7;
    const shortage = inventory < safety ? Math.ceil(safety - inventory) : 0;
    item['Shortage quantity'] = shortage;
    return item;
  });
}

// 공통 필드 추출
function getAllFields(resultArray) {
  return resultArray[0] ? Object.keys(resultArray[0]).filter(k => k !== '_id') : [];
}

// 목록
router.get('/', async (req, res) => {
  const keyword = '';
  try {
    const result = await db.collection('coupang').find().sort({ 'Product name': 1 }).toArray();
    const resultWithShortage = addShortage(result);
    let selected = req.query.fields;
    if (selected && !Array.isArray(selected)) selected = selected.split(',');
    const fields = (selected && selected.length > 0)
      ? DEFAULT_COLUMNS.filter(col => selected.includes(col))
      : DEFAULT_COLUMNS;
    res.render('coupang.ejs', {
      결과: resultWithShortage,
      필드: fields,
      전체필드: DEFAULT_COLUMNS,
      성공메시지: null,
      한글,
      keyword
    });
  } catch (err) {
    console.error('GET /coupang 오류:', err);
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

    // ✅ 헤더는 1행, 데이터는 2행부터
    const headerRow = sheetData[0];
    const dataRows = sheetData.slice(1);

    // 매핑
    const indexMap = {};
    IMPORT_COLUMNS.forEach(key => {
      const idx = headerRow.findIndex(col => col && col.trim() === key);
      if (idx !== -1) indexMap[key] = idx;
    });

    const data = dataRows.map(row => {
      const obj = {};
      for (const col of IMPORT_COLUMNS) {
        let val = row[indexMap[col]] ?? '';
        if (NUMERIC_COLUMNS.includes(col)) {
          const num = Number(String(val).replace(/,/g, ''));
          obj[col] = isNaN(num) ? 0 : num;
        } else {
          obj[col] = val;
        }
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
    const resultWithShortage = addShortage(resultArray);
    res.render('coupang.ejs', {
      결과: resultWithShortage,
      필드: DEFAULT_COLUMNS,
      전체필드: DEFAULT_COLUMNS,
      성공메시지: '✅ 업로드 완료',
      한글
    });
  } catch (err) {
    console.error('POST /coupang/upload 오류:', err);
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
    const resultWithShortage = addShortage(result);
    let selected = req.query.fields;
    if (selected && !Array.isArray(selected)) selected = selected.split(',');
    const fields = (selected && selected.length > 0)
      ? DEFAULT_COLUMNS.filter(col => selected.includes(col))
      : DEFAULT_COLUMNS;
    res.render('coupang.ejs', {
      결과: resultWithShortage,
      필드: fields,
      전체필드: DEFAULT_COLUMNS,
      성공메시지: null,
      한글,
      keyword
    });
  } catch (err) {
    console.error('GET /coupang/search 오류:', err);
    res.status(500).send('❌ 검색 실패');
  }
});

// 전체 삭제
router.post('/delete-all', checkLogin, async (req, res) => {
  try {
    await db.collection('coupang').deleteMany({});
    res.redirect('/coupang');
  } catch (err) {
    console.error('POST /coupang/delete-all 오류:', err);
    res.status(500).send('❌ 삭제 실패');
  }
});

module.exports = router;

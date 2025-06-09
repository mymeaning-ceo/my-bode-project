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

// 업로드 디렉토리
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

// 검색 가능한 브랜드 목록
const BRANDS = ['BYC', '트라이', '제임스딘', '스페클로', '물랑루즈'];

// 한글 매핑 및 필드 정의
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

// 부족재고량 계산 함수
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

// 필드 추출 함수
function getAllFields(resultArray) {
  return resultArray[0] ? Object.keys(resultArray[0]).filter(k => k !== '_id') : [];
}

// 목록 렌더링
router.get('/', async (req, res) => {
  const keyword = '';
  const brand = req.query.brand || '';
  try {
    const query = brand ? { 'Product name': new RegExp(brand, 'i') } : {};
    let result = await db.collection('coupang').find(query).sort({ 'Product name': 1 }).toArray();

    result = result.map(row => {
      const newRow = { ...row };
      if (typeof newRow['Option ID'] === 'number') {
        newRow['Option ID'] = String(newRow['Option ID']);
      }
      NUMERIC_COLUMNS.forEach(col => {
        if (col !== 'Option ID' && newRow[col] !== undefined && newRow[col] !== null) {
          const num = Number(String(newRow[col]).replace(/,/g, ''));
          newRow[col] = isNaN(num) ? 0 : num;
        }
      });
      return newRow;
    });

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
      keyword,
      brand,
      brandOptions: BRANDS
    });
  } catch (err) {
    console.error('GET /coupang 오류:', err);
    res.status(500).send('❌ 재고 목록 불러오기 실패');
  }
});

// 엑셀 업로드 처리
router.post('/upload', upload.single('excelFile'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const dataRows = sheetData.slice(1); // 헤더가 아닌 본문만

    const data = dataRows.map(row => {
      const obj = {};

      obj['Option ID'] = row[0] ?? '';
      obj['Product name'] = row[1] ?? '';
      obj['Option name'] = row[2] ?? '';

      const inventory = Number(String(row[7]).replace(/,/g, '')) || 0;
      obj['Orderable quantity (real-time)'] = inventory;

      const salesAmount = Number(String(row[11]).replace(/,/g, '')) || 0;
      obj['Sales amount on the last 30 days'] = salesAmount;

      const salesCount = Number(String(row[13]).replace(/,/g, '')) || 0;
      obj['Sales in the last 30 days'] = salesCount;

      // 부족재고량 계산
      const daily = salesCount / 30;
      const safety = daily * 7;
      obj['Shortage quantity'] = inventory < safety ? Math.ceil(safety - inventory) : 0;

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

    const resultWithShortage = addShortage(data); // 보기용 재계산 (이미 DB에 저장됨)

    res.render('coupang.ejs', {
      결과: resultWithShortage,
      필드: DEFAULT_COLUMNS,
      전체필드: DEFAULT_COLUMNS,
      성공메시지: '✅ 엑셀 업로드 완료',
      한글,
      keyword: '',
      brand: '',
      brandOptions: BRANDS
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
    const brand = req.query.brand || '';
    const regex = keyword ? new RegExp(keyword, 'i') : null;
    const brandRegex = brand ? new RegExp(brand, 'i') : null;

    const conditions = [];
    if (regex) {
      conditions.push({
        $or: [
          { 'Product name': regex },
          { 'Option name': regex },
          { 'Option ID': regex }
        ]
      });
    }
    if (brandRegex) {
      conditions.push({ 'Product name': brandRegex });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};
    let result = await db.collection('coupang').find(query).sort({ 'Product name': 1 }).toArray();

    result = result.map(row => {
      const newRow = { ...row };
      if (typeof newRow['Option ID'] === 'number') newRow['Option ID'] = String(newRow['Option ID']);
      NUMERIC_COLUMNS.forEach(col => {
        if (col !== 'Option ID' && newRow[col] !== undefined && newRow[col] !== null) {
          const num = Number(String(newRow[col]).replace(/,/g, ''));
          newRow[col] = isNaN(num) ? 0 : num;
        }
      });
      return newRow;
    });

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
      keyword,
      brand,
      brandOptions: BRANDS
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

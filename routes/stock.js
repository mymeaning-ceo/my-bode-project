const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { checkLogin } = require('../middlewares/auth');
const { exec } = require('child_process');



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
    const fields =
      STOCK_COLUMNS || (result[0] ? Object.keys(result[0]).filter(k => k !== '_id') : []);
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
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(/\.xlsx?$/, '.json');

    const pythonCommand = 'python'; // 또는 'python3' 환경에 따라 조정

    exec(`${pythonCommand} scripts/excel_to_json.py "${inputPath}" "${outputPath}"`, async (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Python 오류:', stderr);
        return res.status(500).send('Python 변환 실패');
      }

      console.log('✅ Python 출력:', stdout);

      // ✅ JSON 파일 읽기
      const jsonData = fs.readFileSync(outputPath, 'utf-8');
      const data = JSON.parse(jsonData);
      const headers = data[0] ? Object.keys(data[0]) : [];

      // ✅ MongoDB 저장
      await db.collection('stock').deleteMany({});
      if (data.length) await db.collection('stock').insertMany(data);

      // 임시 파일 삭제
      fs.unlink(inputPath, () => {});
      fs.unlink(outputPath, () => {});

      res.render('stock.ejs', {
        결과: data,
        필드: headers,
        성공메시지: '✅ 엑셀 업로드 및 변환 완료'
      });
    });
  } catch (err) {
    console.error('❌ 업로드 오류:', err);
    res.status(500).send('Upload failed');
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

router.post('/preview', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) throw new Error('❌ 파일 없음');

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (sheetData.length < 3) throw new Error('❌ 데이터 부족');

    const headers = sheetData[1];
    const dataRows = sheetData.slice(2);

    const fieldCounter = {};
    const uniqueHeaders = headers.map(h => {
      if (!h) return '';
      const base = h.trim();
      if (!fieldCounter[base]) {
        fieldCounter[base] = 1;
        return base;
      } else {
        fieldCounter[base]++;
        return `${base}${fieldCounter[base]}`;
      }
    });

    const previewData = dataRows.map(row => {
      const item = {};
      uniqueHeaders.forEach((key, i) => {
        item[key] = row[i] ?? '';
      });
      return item;
    });

    fs.unlink(req.file.path, () => {});

  res.render('preview.ejs', {
    데이터: previewData.slice(0, 30),
    필드: uniqueHeaders
  });
} catch (err) {
  console.error(err);
  res.status(500).send('미리보기 실패');
}
});



module.exports = router;

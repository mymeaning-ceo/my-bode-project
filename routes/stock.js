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
    const filePath = req.file.path; // 업로드된 Excel 경로
    const csvPath = filePath.replace(/\.(xls|xlsx)$/i, '.csv');

    // 1) 파이썬 스크립트 실행: 엑셀 → CSV(정규화)
    const { execSync } = require('child_process');
    execSync(`python transform_try.py "${filePath}" "${csvPath}"`);

    // 2) CSV → JSON 로드
    const csv = require('csvtojson');
    const jsonArray = await csv().fromFile(csvPath);

    // 3) MongoDB 저장
    const { MongoClient } = require('mongodb');
    const client = await MongoClient.connect(process.env.MONGO_URI);
    const db = client.db('TRY_stock');
    const collection = db.collection('allocation');

    await collection.deleteMany({}); // 기존 데이터 초기화
    await collection.insertMany(jsonArray); // 새 데이터 삽입

    client.close();

    // 4) 업로드 완료 후 화면 이동
    res.redirect('/stock'); // stock.ejs 렌더링
  } catch (err) {
    console.error(err);
    res.status(500).send('Upload & transform failed');
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

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

// uploads directory ensure
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const upload = multer({ dest: uploadsDir });

// default inventory page
router.get('/', async (req, res) => {
  try {
    const result = await db.collection('coupang').find().sort({ 'Product name': 1 }).toArray();
    res.render('coupang.ejs', { 결과: result, 성공메시지: null });
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
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rawData.length === 0) {
      return res.status(400).send('❌ 엑셀 파일이 비어 있습니다.');
    }

    // pick needed fields
    const data = rawData.map(row => ({
      'Option ID': row['Option ID'],
      'Product name': row['Product name'],
      'Option name': row['Option name'],
      'Orderable quantity (real-time)': row['Orderable quantity (real-time)'],
      'Recent sales (Excluding bundle sales) Last 30 days': row['Recent sales (Excluding bundle sales) Last 30 days'],
      'Recent sales quantity Last 30 days': row['Recent sales quantity Last 30 days']
    }));

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
    res.render('coupang.ejs', {
      결과: resultArray,
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

    res.render('coupang.ejs', { 결과: result, 성공메시지: null });
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

module.exports = router;
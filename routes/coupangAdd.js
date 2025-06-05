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

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit to avoid truncated uploads
});

router.get('/', async (req, res) => {
  try {
    const result = await db.collection('coupangAdd').find().toArray();
    const fields = result[0] ? Object.keys(result[0]).filter(k => k !== '_id') : [];
    res.render('coupangAdd.ejs', { 결과: result, 필드: fields, 성공메시지: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ 목록 불러오기 실패');
  }
});

router.post('/upload', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('❌ 파일이 업로드되지 않았습니다.');

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    await db.collection('coupangAdd').deleteMany({});
    if (data.length > 0) await db.collection('coupangAdd').insertMany(data);

    fs.unlink(filePath, () => {});

    const result = await db.collection('coupangAdd').find().toArray();
    const fields = result[0] ? Object.keys(result[0]).filter(k => k !== '_id') : [];
    res.render('coupangAdd.ejs', { 결과: result, 필드: fields, 성공메시지: '✅ 업로드 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ 업로드 실패');
  }
});

router.post('/delete-all', checkLogin, async (req, res) => {
  try {
    await db.collection('coupangAdd').deleteMany({});
    res.redirect('/coupang/add');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ 삭제 실패');
  }
});

module.exports = router;

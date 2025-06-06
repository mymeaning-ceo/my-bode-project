const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js'); // 최신 방식!
const connectDB = require('../database');

let db;
connectDB.then(client => { db = client.db('forum'); });

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

router.get('/', (req, res) => {
  res.render('ocr.ejs', { text: null, id: null });
});

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('이미지를 업로드해주세요.');
  try {
    const { data: { text } } = await Tesseract.recognize(req.file.path, 'kor+eng', {
      logger: m => console.log(m)
    });
    fs.unlink(req.file.path, () => {});

    let insertedId = null;
    if (db) {
      const result = await db.collection('ocrtexts').insertOne({ text, createdAt: new Date() });
      insertedId = result.insertedId;
    }

    res.render('ocr.ejs', { text, id: insertedId });
  } catch (err) {
    console.error('OCR error:', err);
    fs.unlink(req.file.path, () => {});
    res.status(500).send('텍스트 추출 실패');
  }
});

module.exports = router;

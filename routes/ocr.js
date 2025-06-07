<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const vision = require('@google-cloud/vision');
const visionClient = new vision.ImageAnnotatorClient();
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
    // 구글 비전 OCR 호출
    const [result] = await visionClient.textDetection(req.file.path);
    const text = result.fullTextAnnotation ? result.fullTextAnnotation.text : '';

    // 업로드된 이미지 파일 삭제
    fs.unlink(req.file.path, () => {});

    // DB 저장
    let insertedId = null;
    if (db) {
      const insertResult = await db.collection('ocrtexts').insertOne({ text, createdAt: new Date() });
      insertedId = insertResult.insertedId;
    }

    res.render('ocr.ejs', { text, id: insertedId });
  } catch (err) {
    console.error('OCR error:', err);
    fs.unlink(req.file.path, () => {});
    res.status(500).send('텍스트 추출 실패');
  }
});

module.exports = router;
=======
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const vision = require('@google-cloud/vision');
const visionClient = new vision.ImageAnnotatorClient();
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
    // 구글 비전 OCR 호출
    const [result] = await visionClient.textDetection(req.file.path);
    const text = result.fullTextAnnotation ? result.fullTextAnnotation.text : '';

    // 업로드된 이미지 파일 삭제
    fs.unlink(req.file.path, () => {});

    // DB 저장
    let insertedId = null;
    if (db) {
      const insertResult = await db.collection('ocrtexts').insertOne({ text, createdAt: new Date() });
      insertedId = insertResult.insertedId;
    }

    res.render('ocr.ejs', { text, id: insertedId });
  } catch (err) {
    console.error('OCR error:', err);
    fs.unlink(req.file.path, () => {});
    res.status(500).send('텍스트 추출 실패');
  }
});

module.exports = router;
>>>>>>> e64b824c86d54036124f4af898c95dcecdd5cd57

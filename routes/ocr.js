const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

// 임시 업로드 폴더 보장
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

// OCR 입력 폼
router.get('/', (req, res) => {
  res.render('ocr.ejs', { text: null });
});

// 이미지에서 텍스트 추출
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('이미지를 업로드해주세요.');
  const worker = createWorker();
  try {
    await worker.load();
    await worker.loadLanguage('kor+eng');
    await worker.initialize('kor+eng');
    const { data: { text } } = await worker.recognize(req.file.path);
    await worker.terminate();
    fs.unlink(req.file.path, () => {});
    res.render('ocr.ejs', { text });
  } catch (err) {
    console.error('OCR error:', err);
    fs.unlink(req.file.path, () => {});
    res.status(500).send('텍스트 추출 실패');
  }
});

module.exports = router;

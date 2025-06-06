const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Tesseract.js를 이용해 Tesseract OCR 엔진을 사용한다
const { createWorker } = require('tesseract.js');
const connectDB = require('../database');
let db;
connectDB.then(client => { db = client.db('forum'); });


// 임시 업로드 폴더 보장
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

// OCR 입력 폼
router.get('/', (req, res) => {

  res.render('ocr.ejs', { text: null, id: null, logs: null });

});

// 이미지에서 텍스트 추출
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('이미지를 업로드해주세요.');


  const logs = [];
  const worker = createWorker({
    logger: m => {
      if (m.status === 'recognizing text') {
        // 실시간 진행률을 배열에 저장해 화면에 표시
        const pct = (m.progress * 100).toFixed(1);
        logs.push(`OCR 진행률: ${pct}%`);
      }
    }
  });

  const lang = process.env.TESS_LANG || 'kor+eng';
  try {
    await worker.load();
    // 언어 데이터는 환경변수 TESS_LANG 로 지정 가능
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    // PSM 6을 사용해 텍스트 인식 정확도 향상
    await worker.setParameters({ tessedit_pageseg_mode: '6', user_defined_dpi: '300' });

    const { data: { text } } = await worker.recognize(req.file.path);
    logs.push('✅ OCR 인식 완료');
    await worker.terminate();
    fs.unlink(req.file.path, () => {});

    let id = null;
    if (db) {
      const result = await db.collection('ocrtexts').insertOne({ text, createdAt: new Date() });
      id = result.insertedId;
    }

    res.render('ocr.ejs', { text, id, logs });
  } catch (err) {
    console.error('OCR error:', err);
    fs.unlink(req.file.path, () => {});
    logs.push('❌ OCR 실패');
    res.render('ocr.ejs', { text: null, id: null, logs });

  }
});

module.exports = router;

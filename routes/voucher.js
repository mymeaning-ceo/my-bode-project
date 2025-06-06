const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
const connectDB = require('../database');
let db;
connectDB.then(client => { db = client.db('forum'); });

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const upload = multer({ dest: uploadsDir });

// 전표 목록을 조회한다. 저장된 필드 중 "매출금액"의 합계를 계산하여 화면에 전달한다.
router.get('/', async (req, res) => {
  const list = db ? await db.collection('vouchers').find().toArray() : [];
  // 새로운 필드명에 맞춰 총액을 계산한다.
  const total = list.reduce((acc, v) => acc + (v['매출금액'] || 0), 0);
  res.render('voucher.ejs', { list, total });
});

router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('전표 이미지를 업로드해주세요.');
  const worker = createWorker();
  try {
    await worker.load();
    await worker.loadLanguage('kor+eng');
    await worker.initialize('kor+eng');
    const { data: { text } } = await worker.recognize(req.file.path);
    await worker.terminate();
    fs.unlink(req.file.path, () => {});
    const fields = await parseVoucher(text);
    if (fields && db) await db.collection('vouchers').insertOne(fields);
    res.redirect('/voucher');
  } catch (err) {
    console.error('Voucher OCR error:', err);
    fs.unlink(req.file.path, () => {});
    res.status(500).send('전표 처리 실패');
  }
});

async function parseVoucher(text) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    // 새롭게 정의된 필드를 GPT에게 요청한다.
    const prompt = `다음 전표 내용에서 전표 매출일, 공급 세액, 세함가, 상품명, 품명, 출고수량, 매출단가, 매출금액을 JSON으로 반환해 주세요.\n${text}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200
      })
    });
    if (!response.ok) throw new Error('OpenAI error');
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (err) {
    console.error('GPT parsing error:', err);
    return null;
  }
}

module.exports = router;

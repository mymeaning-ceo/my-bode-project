const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/coupangAddController');

// 페이지 - React에서 렌더링
router.get('/', (req, res) => {
  const path = require('path');
  const reactIndex = path.join(__dirname, '..', '..', 'client', 'public', 'index.html');
  res.sendFile(reactIndex);
});

// 엑셀 업로드
router.post('/upload', ctrl.upload, ctrl.uploadExcel);

// 전체 삭제
router.post('/delete-all', async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.collection('coupangAdd').deleteMany({});
    res.redirect('/coupang/add');
  } catch (err) {
    console.error('삭제 실패:', err);
    res.status(500).send('❌ 삭제 실패');
  }
});

module.exports = router;

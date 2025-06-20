const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/coupangAddController');

// 페이지
router.get('/', ctrl.renderPage);

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

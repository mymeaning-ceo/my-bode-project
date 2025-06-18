const express = require('express');
const router = express.Router();
const upload = require('../../upload.js');
const { checkAdmin } = require('../../middlewares/auth');

// ─────────────────────────────────────────
// 관리자 메인 페이지
// ─────────────────────────────────────────
router.get('/', checkAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const logoDoc = await db.collection('homepage').findOne({ key: 'logo' });
    const banners = [];
    for (let i = 1; i <= 4; i++) {
      const doc = await db.collection('homepage').findOne({ key: 'banner' + i });
      banners.push(doc?.img || '');
    }
    res.render('admin/index.ejs', { banners, logo: logoDoc?.img || '' });
  } catch (err) {
    console.error('❌ 관리자 페이지 오류:', err);
    res.status(500).send('서버 오류');
  }
});

// ─────────────────────────────────────────
// 배너 업로드 및 삭제
// ─────────────────────────────────────────
router.post('/banner/:idx', checkAdmin, upload.single('banner'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const idx = req.params.idx;
    const imgLocation = req.file ? req.file.location || req.file.path : '';
    await db.collection('homepage').updateOne(
      { key: 'banner' + idx },
      { $set: { img: imgLocation, updatedAt: new Date() } },
      { upsert: true }
    );
    res.redirect('/admin');
  } catch (err) {
    console.error('❌ 배너 업로드 실패:', err);
    res.status(500).send('서버 오류');
  }
});

router.post('/banner/:idx/delete', checkAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.collection('homepage').deleteOne({ key: 'banner' + req.params.idx });
    res.redirect('/admin');
  } catch (err) {
    console.error('❌ 배너 삭제 실패:', err);
    res.status(500).send('서버 오류');
  }
});

// ─────────────────────────────────────────
// 로고 업로드 및 삭제
// ─────────────────────────────────────────
router.post('/logo', checkAdmin, upload.single('logo'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const imgLocation = req.file ? req.file.location || req.file.path : '';
    await db.collection('homepage').updateOne(
      { key: 'logo' },
      { $set: { img: imgLocation, updatedAt: new Date() } },
      { upsert: true }
    );
    res.redirect('/admin');
  } catch (err) {
    console.error('❌ 로고 업로드 실패:', err);
    res.status(500).send('서버 오류');
  }
});

router.post('/logo/delete', checkAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.collection('homepage').deleteOne({ key: 'logo' });
    res.redirect('/admin');
  } catch (err) {
    console.error('❌ 로고 삭제 실패:', err);
    res.status(500).send('서버 오류');
  }
});

module.exports = router;

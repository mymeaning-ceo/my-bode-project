const express = require('express');
const router = express.Router();
const upload = require('../upload.js');
const { checkLogin } = require('../middlewares/auth');

let db;
const connectDB = require('../database');
connectDB.then(client => db = client.db('forum'));

// 관리자 페이지 화면
router.get('/', checkLogin, async (req, res) => {
  const hero = await db.collection('homepage').findOne({ key: 'hero' });
  const logo = await db.collection('homepage').findOne({ key: 'logo' });
  res.render('admin/index.ejs', {
    hero: hero?.img || '',
    logo: logo?.img || ''
  });
});

// 메인 이미지 업로드
router.post('/hero', checkLogin, upload.single('hero'), async (req, res) => {
  const imgLocation = req.file ? req.file.location : '';
  await db.collection('homepage').updateOne(
    { key: 'hero' },
    { $set: { img: imgLocation, updatedAt: new Date() } },
    { upsert: true }
  );
  res.redirect('/admin');
});

router.post('/logo', checkLogin, upload.single('logo'), async (req, res) => {
  const imgLocation = req.file ? req.file.location : '';
  await db.collection('homepage').updateOne(
    { key: 'logo' },
    { $set: { img: imgLocation, updatedAt: new Date() } },
    { upsert: true }
  );
  res.redirect('/admin');
});

module.exports = router;
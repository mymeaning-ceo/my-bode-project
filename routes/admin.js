const express = require('express');
const router = express.Router();
const upload = require('../upload.js');
const { checkLogin, checkAdmin } = require('../middlewares/auth');

let db;
const connectDB = require('../database');
connectDB.then(client => db = client.db('forum'));

// 관리자 페이지 화면
router.get('/', checkAdmin, async (req, res) => {
  const hero = await db.collection('homepage').findOne({ key: 'hero' });
  const logo = await db.collection('homepage').findOne({ key: 'logo' });
  res.render('admin/index.ejs', {
    hero: hero?.img || '',
    logo: logo?.img || ''
  });
});

// 메인 이미지 업로드
router.post('/hero', checkAdmin, upload.single('hero'), async (req, res) => {
  const imgLocation = req.file ? req.file.location : '';
  await db.collection('homepage').updateOne(
    { key: 'hero' },
    { $set: { img: imgLocation, updatedAt: new Date() } },
    { upsert: true }
  );
  res.redirect('/admin');
});

// 메인 배너 이미지 삭제
router.post('/delete-all', checkAdmin, async (req, res) => {
  await db.collection('homepage').deleteOne({ key: 'hero' });
  res.redirect('/admin');
});

router.post('/logo', checkAdmin, upload.single('logo'), async (req, res) => {
  const imgLocation = req.file ? req.file.location : '';
  await db.collection('homepage').updateOne(
    { key: 'logo' },
    { $set: { img: imgLocation, updatedAt: new Date() } },
    { upsert: true }
  );
  res.redirect('/admin');
});

// 로고 이미지 삭제
router.post('/logo/delete', checkAdmin, async (req, res) => {
  await db.collection('homepage').deleteOne({ key: 'logo' });
  res.redirect('/admin');
});

// ===== 뷰 접근 권한 설정 =====
const managedViews = ['/stock', '/coupang', '/list', '/write'];

router.get('/permissions', checkAdmin, async (req, res) => {
  const docs = await db.collection('permissions').find().toArray();
  const permissions = {};
  docs.forEach(d => {
    permissions[d.view] = {
      loginRequired: d.loginRequired,
      allowedUsers: d.allowedUsers || []
    }
  });

  const users = await db.collection('user').find({}, { projection: { username: 1 } }).toArray();
  res.render('admin/permissions.ejs', { views: managedViews, permissions, users });

});

router.post('/permissions', checkAdmin, async (req, res) => {
  const selected = req.body.view || [];
  const arr = Array.isArray(selected) ? selected : [selected];
  await Promise.all(managedViews.map(v => {
    const loginRequired = arr.includes(v);
    const users = req.body['user_' + v];
    const allowedUsers = Array.isArray(users) ? users : users ? [users] : [];
    return db.collection('permissions').updateOne(
      { view: v },
      { $set: { view: v, loginRequired, allowedUsers } },
      { upsert: true }
    );
  }));
  if (global.loadPermissions) await global.loadPermissions();
  res.redirect('/admin/permissions');
});

module.exports = router;
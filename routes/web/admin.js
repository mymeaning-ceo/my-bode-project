const express = require('express');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

const router = express.Router();
const upload = require('../../upload.js');
const { checkAdmin } = require('../../middlewares/auth');

function getViewNames() {
  const viewsDir = path.join(__dirname, '../../views');
  return fs
    .readdirSync(viewsDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.ejs'))
    .map((d) => path.basename(d.name, '.ejs'))
    .filter((name) => !['nav', 'error', 'layouts'].includes(name));
}

// 관리자 메인 페이지
router.get('/', checkAdmin, (req, res) => {
  res.render('layouts/admin.ejs', { body: 'admin/index.ejs' });
});

// 배너 관리 페이지
router.get('/banner', checkAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const banners = [];
    for (let i = 1; i <= 4; i++) {
      const doc = await db.collection('homepage').findOne({ key: 'banner' + i });
      banners.push(doc?.img || '');
    }
    res.render('layouts/admin.ejs', { body: 'admin/banner.ejs', banners });
  } catch (err) {
    console.error('❌ 배너 페이지 오류:', err);
    res.status(500).send('서버 오류');
  }
});

// 로고 관리 페이지
router.get('/logo', checkAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const logoDoc = await db.collection('homepage').findOne({ key: 'logo' });
    res.render('layouts/admin.ejs', {
      body: 'admin/logo.ejs',
      logo: logoDoc?.img || '',
    });
  } catch (err) {
    console.error('❌ 로고 페이지 오류:', err);
    res.status(500).send('서버 오류');
  }
});

// 배너 업로드 및 삭제
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
    if (req.query.redirect || req.body.redirect) {
      res.redirect(req.query.redirect || req.body.redirect);
    } else {
      const tab = req.query.tab || req.body.tab || 'bannerSection';
      res.redirect(`/admin?tab=${tab}`);
    }
  } catch (err) {
    console.error('❌ 배너 업로드 실패:', err);
    res.status(500).send('서버 오류');
  }
});

router.post('/banner/:idx/delete', checkAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.collection('homepage').deleteOne({ key: 'banner' + req.params.idx });
    if (req.query.redirect || req.body.redirect) {
      res.redirect(req.query.redirect || req.body.redirect);
    } else {
      const tabDel = req.query.tab || req.body.tab || 'bannerSection';
      res.redirect(`/admin?tab=${tabDel}`);
    }
  } catch (err) {
    console.error('❌ 배너 삭제 실패:', err);
    res.status(500).send('서버 오류');
  }
});

// 로고 업로드 및 삭제
router.post('/logo', checkAdmin, upload.single('logo'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const imgLocation = req.file ? req.file.location || req.file.path : '';
    await db.collection('homepage').updateOne(
      { key: 'logo' },
      { $set: { img: imgLocation, updatedAt: new Date() } },
      { upsert: true }
    );
    if (req.query.redirect || req.body.redirect) {
      res.redirect(req.query.redirect || req.body.redirect);
    } else {
      const tabLogo = req.query.tab || req.body.tab || 'logoSection';
      res.redirect(`/admin?tab=${tabLogo}`);
    }
  } catch (err) {
    console.error('❌ 로고 업로드 실패:', err);
    res.status(500).send('서버 오류');
  }
});

router.post('/logo/delete', checkAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.collection('homepage').deleteOne({ key: 'logo' });
    if (req.query.redirect || req.body.redirect) {
      res.redirect(req.query.redirect || req.body.redirect);
    } else {
      const tabLogoDel = req.query.tab || req.body.tab || 'logoSection';
      res.redirect(`/admin?tab=${tabLogoDel}`);
    }
  } catch (err) {
    console.error('❌ 로고 삭제 실패:', err);
    res.status(500).send('서버 오류');
  }
});

// 사용자 목록 및 삭제
router.get('/users', checkAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const q = req.query.q || '';
    const query = q ? { username: new RegExp(q, 'i') } : {};
    const users = await db.collection('user').find(query).sort({ username: 1 }).toArray();
    res.render('layouts/admin.ejs', { body: 'admin/users.ejs', users, q });
  } catch (err) {
    console.error('❌ 사용자 조회 실패:', err);
    res.status(500).send('서버 오류');
  }
});

router.post('/users/delete', checkAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.body.userId;
    if (userId) {
      await db.collection('user').deleteOne({ _id: new ObjectId(userId) });
      await db.collection('permissions').updateMany({}, { $pull: { allowedUsers: userId } });
    }
    res.redirect('/admin/users');
  } catch (err) {
    console.error('❌ 사용자 삭제 실패:', err);
    res.status(500).send('서버 오류');
  }
});

// 페이지 권한 설정
router.get('/permissions', checkAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const views = getViewNames();
    const permsArray = await db.collection('permissions').find({ view: { $in: views } }).toArray();
    const permissions = {};
    permsArray.forEach((p) => {
      permissions[p.view] = { loginRequired: p.loginRequired, allowedUsers: p.allowedUsers || [] };
    });
    const users = await db.collection('user').find().toArray();
    res.render('layouts/admin.ejs', {
      body: 'admin/permissions.ejs',
      views,
      permissions,
      users,
    });
  } catch (err) {
    console.error('❌ 권한 조회 실패:', err);
    res.status(500).send('서버 오류');
  }
});

router.post('/permissions', checkAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const views = getViewNames();
    const selectedViews = req.body.view || [];
    const updates = views.map((v) => {
      const loginRequired = Array.isArray(selectedViews)
        ? selectedViews.includes(v)
        : selectedViews === v;
      let allowed = req.body['user_' + v] || [];
      if (!Array.isArray(allowed)) allowed = allowed ? [allowed] : [];
      return {
        updateOne: {
          filter: { view: v },
          update: { $set: { view: v, loginRequired, allowedUsers: allowed } },
          upsert: true,
        },
      };
    });
    if (updates.length) await db.collection('permissions').bulkWrite(updates);
    res.redirect('/admin/permissions');
  } catch (err) {
    console.error('❌ 권한 저장 실패:', err);
    res.status(500).send('서버 오류');
  }
});

module.exports = router;
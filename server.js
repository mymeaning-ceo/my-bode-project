require('dotenv').config();
const express = require('express')
const app = express()
const { MongoClient, ObjectId } = require('mongodb')
const methodOverride = require('method-override')
const bcrypt = require('bcrypt')
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const MongoStore = require('connect-mongo');
const path = require('path');

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(session({
  secret: '비밀키',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DB_URL,
    dbName: 'forum'
  }),
  cookie: { maxAge: 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

let permissions = {};
const menuLabels = {
  '/stock': '재고 관리',
  '/coupang': '쿠팡 재고',
  '/coupang/add': '매출/광고비',
  '/list': '게시판',
  '/write': '글 작성',
  '/list/write': '글 작성',
  '/admin': '관리자',
  '/ocr': 'OCR',
  '/voucher': '전표 입력'
};

async function loadPermissions() {
  if (!db) return;
  const docs = await db.collection('permissions').find().toArray();
  permissions = {};
  docs.forEach(d => {
    permissions[d.view] = {
      loginRequired: d.loginRequired,
      allowedUsers: d.allowedUsers || []
    };
  });
}
global.loadPermissions = loadPermissions;

// 권한 체크 미들웨어
app.use(async (req, res, next) => {
  const config = permissions[req.path];
  if (!config) return next();

  if (config.loginRequired && !req.isAuthenticated()) {
    return res.redirect('/login?redirect=' + req.path);
  }
  if (config.allowedUsers.length > 0 && (!req.isAuthenticated() || !config.allowedUsers.includes(String(req.user._id)))) {
    return res.status(403).send('권한이 없습니다.');
  }
  next();
});

console.log('🧪 S3_KEY:', process.env.S3_KEY);
console.log('🧪 S3_SECRET:', process.env.S3_SECRET ? '●●●●●' : 'MISSING');

const { S3Client } = require('@aws-sdk/client-s3');
const uploadExcel = multer({ dest: 'uploads/' });

app.use((req, res, next) => {
  res.locals.유저 = req.user;
  next();
});

app.use((req, res, next) => {
  res.locals.currentUrl = req.path;
  next();
});

app.use(async (req, res, next) => {
  if (!db) return next();
  try {
    const logoConfig = await db.collection('homepage').findOne({ key: 'logo' });
    res.locals.logo = logoConfig?.img || '';
    const banners = [];
    for (let i = 1; i <= 4; i++) {
      const doc = await db.collection('homepage').findOne({ key: 'banner' + i });
      if (doc?.img) banners.push(doc.img);
    }
    res.locals.banners = banners;
  } catch (err) {
    console.error(err);
    res.locals.logo = '';
    res.locals.banners = [];
  }
  next();
});

/**
 * 엘셀 업로드 → Python 변환 → MongoDB 저장
 */
const upload = multer({ dest: 'uploads/' });

app.post('/stock/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file not found' });

    const filePath = req.file.path;
    const scriptPath = path.join(__dirname, 'scripts', 'excel_to_mongo.py');
    const py = spawn('python3', [
      scriptPath,
      filePath
    ], {
      env: {
        ...process.env,
        MONGO_URI: process.env.DB_URL
      }
    });

    let pyError = '';
    py.stderr.on('data', data => { pyError += data.toString(); });

    py.on('close', code => {
      fs.unlink(filePath, () => {});
      if (code === 0) return res.json({ ok: true });
      return res.status(500).json({ error: 'python script failed', code, details: pyError.trim() });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  }
});


let connectDB = require('./database.js');
let db;
connectDB.then(client => {
  console.log('DB연결성공');
  db = client.db('forum');
  loadPermissions();
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT} 에서 서버 실행중`);
  });
}).catch(err => {
  console.log(err);
});

const { checkLogin, checkAdmin } = require('./middlewares/auth');
app.get('/secure', checkLogin, (요청, 응답) => {
  응답.send('로그인 사용자')
})

app.get('/', async (req, res) => {
  // 로그인 여부와 상관없이 동일한 메인 페이지
  res.render('index.ejs', { banners: res.locals.banners });
});

app.get('/dashboard', checkLogin, (req, res) => {
  const menus = Object.keys(permissions).filter(v => {
    const p = permissions[v]
    if (p.loginRequired && !req.isAuthenticated()) return false
    if (p.allowedUsers && p.allowedUsers.length > 0 && (!req.isAuthenticated() || !p.allowedUsers.includes(String(req.user._id)))) return false
    return true
  })
  res.render('dashboard.ejs', { banners: res.locals.banners, menus, menuLabels })
});

app.get('/news', (요청, 응답) => {
  db.collection('post').insertOne({ title: '어쩌구' })
})

app.get('/time', (요청, 응답) => {
  응답.render('time.ejs', { data: new Date() })
})

app.use('/', require('./routes/post.js'))
app.use('/admin', require('./routes/admin.js'))

app.get(['/list', '/list/:page'], async (요청, 응답) => {
  const page = parseInt(요청.params.page || '1');
  const limit = 10;
  const skip = (page - 1) * limit;

  const total = await db.collection('post').countDocuments();
  const totalPage = Math.ceil(total / limit);

  const result = await db.collection('post')
    .find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  응답.render('list.ejs', {
    글목록: result,
    현재페이지: page,
    전체페이지: totalPage
  });
});

passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
  let result = await db.collection('user').findOne({ username : 입력한아이디})
  if (!result) {
    return cb(null, false, { message: '아이디 DB에 없음' })
  }

  if (await bcrypt.compare(입력한비번, result.password)) {
    return cb(null, result)
  } else {
    return cb(null, false, { message: '비번불일치' });
  }
}))

passport.serializeUser((user, done) => {
  console.log(user)
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username })
  })
})

passport.deserializeUser(async (user, done) => {
  let result = await db.collection('user').findOne({_id : new ObjectId(user.id)})
  delete result.password
  process.nextTick(() => {
   done(null, result)
  })
})

app.get('/login', (요청, 응답) => {
  응답.render('login.ejs', { redirectTo: 요청.query.redirect || '/' });
})

app.post('/login', (요청, 응답, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) return 응답.status(500).json(error);
    if (!user) return 응답.status(401).json(info.message);

    요청.logIn(user, (err) => {
      if (err) return next(err);
      응답.redirect('/dashboard');  // ✅ 로그인 후 이동할 페이지
    });
  })(요청, 응답, next);
});

app.get('/mypage', checkLogin, (요청, 응답) => {
  응답.render('mypage.ejs', { 유저: 요청.user });
});

app.post('/mypage/password', checkLogin, async (req, res) => {
  const { password, password2 } = req.body
  if (password !== password2) {
    return res.status(400).send('비밀번호가 일치하지 않습니다.')
  }
  const hash = await bcrypt.hash(password, 10)
  await db.collection('user').updateOne(
    { _id: new ObjectId(req.user._id) },
    { $set: { password: hash } }
  )
  res.send('<script>alert("비밀번호가 변경되었습니다.");location.href="/mypage";</script>')
})

app.get('/profile', checkLogin, (req, res) => {
  res.render('profile.ejs', { 유저: req.user });
});

app.post('/profile', checkLogin, async (req, res) => {
  const { password, password2, email, phone } = req.body;
  const update = {};
  if (password) {
    if (password !== password2) {
      return res.status(400).send('비밀번호가 일치하지 않습니다.');
    }
    update.password = await bcrypt.hash(password, 10);
  }
  if (typeof email !== 'undefined') update.email = email;
  if (typeof phone !== 'undefined') update.phone = phone;
  if (Object.keys(update).length > 0) {
    await db.collection('user').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: update }
    );
  }
  res.send('<script>alert("정보가 수정되었습니다.");location.href="/profile";</script>');
});

app.get('/register', (요청, 응답) => {
  응답.render('register.ejs')
})

app.post('/register', async (요청, 응답) => {
  const { username, password, password2 } = 요청.body;

  // 비밀번호 불일치 확인
  if (password !== password2) {
    return 응답.status(400).send('비밀번호가 일치하지 않습니다.');
  }

  // 아이디 중복 확인
  let 기존유저 = await db.collection('user').findOne({ username });
  if (기존유저) {
    return 응답.status(400).send('이미 존재하는 아이디입니다.');
  }

  // 비밀번호 해시 후 저장
  let 해시 = await bcrypt.hash(password, 10);
  await db.collection('user').insertOne({
    username,
    password: 해시
  });

  응답.redirect('/');
});

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

// ---------- 라우트 추가 부분 ----------
app.use('/shop', require('./routes/shop.js'))
app.use('/board/sub', require('./routes/board.js'))
app.use('/search', require('./routes/search.js'));
app.use('/stock', require('./routes/stock.js'));
app.use('/coupang', require('./routes/coupang.js'));
app.use('/coupang/add', require('./routes/coupangAdd.js'));
app.use('/voucher', require('./routes/voucher.js'));
app.use('/ocr', require('./routes/ocr.js'));
app.use('/help', require('./routes/help.js'));
app.use('/', require('./routes/auth.js'));

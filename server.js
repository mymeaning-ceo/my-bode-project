require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const app = express();
const session = require('express-session');
const { MongoClient, ObjectId } = require('mongodb');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const path = require('path');
const stockRouter = require('./routes/stock');
const connectDB = require('./database');
const { checkLogin, checkAdmin } = require('./middlewares/auth');

// MongoDB connection
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// 세션 설정
app.use(session({
  secret: '비밀키',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DB_URL,
    dbName: 'forum',
    collectionName: 'sessions',
    ttl: 60 * 60
  }),
  cookie: { maxAge: 60 * 60 * 1000 }
}));

// Passport 설정
app.use(passport.initialize());
app.use(passport.session());

// EJS 글로벌 변수 설정
app.use((req, res, next) => {
  res.locals.유저 = req.user || null;
  res.locals.currentUrl = req.path || '';
  next();
});

// 메뉴 라벨 정의
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

let db;
let permissions = {};

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

// 접근 권한 체크 미들웨어
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

// 로고/배너 로드
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

// Stock 업로드 (Python 변환)
const upload = multer({ dest: 'uploads/' });
app.post('/stock/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file not found' });
    const filePath = req.file.path;
    const scriptPath = path.join(__dirname, 'scripts', 'excel_to_mongo.py');
    const py = spawn('python3', [scriptPath, filePath], {
      env: { ...process.env, MONGO_URI: process.env.DB_URL }
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

// DB 연결 후 서버 시작
connectDB.then(client => {
  db = client.db('forum');
  app.locals.db = db;
  loadPermissions();

  app.use('/', require('./routes/post'));
  app.use('/stock', stockRouter);
  app.use('/admin', require('./routes/admin'));
  app.use('/shop', require('./routes/shop'));
  app.use('/board/sub', require('./routes/board'));
  app.use('/search', require('./routes/search'));
  app.use('/coupang', require('./routes/coupang'));
  app.use('/coupang/add', require('./routes/coupangAdd'));
  app.use('/voucher', require('./routes/voucher'));
  app.use('/ocr', require('./routes/ocr'));
  app.use('/help', require('./routes/help'));
  app.use('/', require('./routes/auth'));
  

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ http://localhost:${PORT} 에서 서버 실행중`);
  });
}).catch(console.error);

// 인증 라우트들
app.get('/secure', checkLogin, (req, res) => res.send('로그인 사용자'));
app.get('/', (req, res) => res.render('index.ejs', { banners: res.locals.banners }));
app.get('/dashboard', checkLogin, (req, res) => {
  const menus = Object.keys(permissions).filter(v => {
    const p = permissions[v];
    if (p.loginRequired && !req.isAuthenticated()) return false;
    if (p.allowedUsers.length > 0 && (!req.isAuthenticated() || !p.allowedUsers.includes(String(req.user._id)))) return false;
    return true;
  });
  res.render('dashboard.ejs', { banners: res.locals.banners, menus, menuLabels });
});

// Passport 전략
passport.use(new LocalStrategy(async (username, password, cb) => {
  const result = await db.collection('user').findOne({ username });
  if (!result) return cb(null, false, { message: '아이디 없음' });
  const match = await bcrypt.compare(password, result.password);
  if (!match) return cb(null, false, { message: '비번 불일치' });
  return cb(null, result);
}));

passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username });
  });
});

passport.deserializeUser(async (user, done) => {
  const result = await db.collection('user').findOne({ _id: new ObjectId(user.id) });
  delete result.password;
  process.nextTick(() => done(null, result));
});


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


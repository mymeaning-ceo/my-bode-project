require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const methodOverride = require('method-override');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./config/db');

const app = express();

// ────────────────────────
// 1) 데이터베이스 연결
// ────────────────────────
connectDB().then(() => {
  const db = require('mongoose').connection.db;
  app.locals.db = db;

  // Passport 설정
  require('./config/passport')(passport, db);

  // ────────────────────────
  // 2) 미들웨어
  // ────────────────────────
 
 app.use(
   helmet({
     contentSecurityPolicy: {
      directives: {
         defaultSrc: ["'self'"],
         scriptSrc: [
           "'self'",
           "https://code.jquery.com",
           "https://cdn.jsdelivr.net",
           "https://cdn.datatables.net"
         ],
         styleSrc: [
           "'self'",
           "'unsafe-inline'",
           "https://cdn.jsdelivr.net",
           "https://cdn.datatables.net"
         ],
         fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
         imgSrc: ["'self'", "data:"]
       }
     }
   })
 );
  app.use(compression());
  app.use(morgan('dev'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('view engine', 'ejs');
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(methodOverride('_method'));
  app.use('/', require('./routes/auth'));

  // 레이아웃
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');

  // 세션
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        dbName: process.env.DB_NAME,
        collectionName: 'sessions',
        ttl: 60 * 60
      }),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000
      }
    })
  );

  // Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // EJS 전역 변수 설정 (★ 추가)
  app.use((req, res, next) => {
  res.locals.유저 = req.user || null;
  res.locals.currentUrl = req.originalUrl;
  next();
});
  // ────────────────────────
  // 3) 라우터
  // ────────────────────────
  app.use('/api/stock', require('./routes/api/stockApi')); // 재고 API
  app.use('/stock', require('./routes/stock'));            // 재고 페이지
  
  app.use('/', require('./routes/auth'));                  // 로그인/회원가입
  app.use('/admin', require('./routes/admin'));            // 관리자
  app.use('/board', require('./routes/board'));            // 게시판
  app.use('/coupang', require('./routes/coupang'));        // 쿠팡 재고
  app.use('/coupang/add', require('./routes/coupangAdd')); // 쿠팡 매출/광고비
  app.use('/help', require('./routes/help'));              // 도움말
  app.get('/', (req, res) => res.redirect('/stock'));      // 기본 루트

  console.log('✅ /api/stock 라우터 등록 완료');

  // ────────────────────────
  // 4) 서버 시작
  // ────────────────────────
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀  http://localhost:${PORT}`));
});

module.exports = app;
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
  app.use(helmet());
  app.use(compression());
  app.use(morgan('dev'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('view engine', 'ejs');
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(methodOverride('_method'));

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

  // ────────────────────────
  // 3) 라우터
  // ────────────────────────
  app.use('/stock', require('./routes/stock'));            // 페이지
  app.use('/api/stock', require('./routes/api/stockApi')); // API
  app.get('/', (req, res) => res.redirect('/stock'));      // 기본 루트

  // ────────────────────────
<<<<<<< HEAD
  // 4) 서버 시작
=======
  // 4) 에러 처리 (필요 시 주석 해제)
  // ────────────────────────
  // const { notFound, errorHandler } = require('./middlewares/errorHandler');
  // app.use(notFound);
  // app.use(errorHandler);

  // ────────────────────────
  // 5) 서버 시작
>>>>>>> fix/stock-route
  // ────────────────────────
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀  http://localhost:${PORT}`));
});
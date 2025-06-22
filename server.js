const path = require("path");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const methodOverride = require("method-override");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const expressLayouts = require("express-ejs-layouts");
const flash = require("connect-flash");

require("./config/loadEnv")(); // .env 로딩
const { connectDB } = require("./config/db");

const app = express();

async function initApp() {
  try {
    // 1. MongoDB 연결
    const db = await connectDB();
    app.locals.db = db;
    console.log("✅ DB 연결 완료");

    // 2. Passport 설정
    try {
      console.log("🔑 Passport 설정 시작...");
      require("./config/passport")(passport, db);
      console.log("✅ Passport 설정 완료");
    } catch (passportErr) {
      console.error("❌ Passport 설정 중 오류 발생:", passportErr);
      throw passportErr;
    }

    // 3. 보안 & 성능 미들웨어
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://code.jquery.com", "https://cdn.jsdelivr.net", "https://cdn.datatables.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdn.datatables.net"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
            imgSrc: ["'self'", "data:"],
          },
        },
      })
    );
    app.use(compression());
    app.use(morgan("dev"));

    // 4. 기본 Express 설정
    app.use(express.static(path.join(__dirname, "public")));
    app.set("view engine", "ejs");
    app.use(expressLayouts);
    app.set("layout", "layouts/main");
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(methodOverride("_method"));

    // 5. 세션, Passport, Flash
    app.use(
      session({
        secret: process.env.SESSION_SECRET || "default_secret",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: process.env.MONGO_URI,
          dbName: process.env.DB_NAME,
          collectionName: "sessions",
          ttl: 60 * 60,
        }),
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 1000,
        },
      })
    );
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    // 6. 전역 변수 설정
    app.use((req, res, next) => {
      res.locals.유저 = req.user || null;
      res.locals.currentUrl = req.originalUrl;
      res.locals.logo = "";
      res.locals.error = req.flash("error");
      res.locals.success = req.flash("success");
      next();
    });

    // 7. 라우터 연결
    try {
      const mainRouter = require("./routes");
      app.use("/", mainRouter);
      console.log("✅ 라우터 연결 완료");
    } catch (routerErr) {
      console.error("❌ 라우터 불러오기 실패:", routerErr);
      throw routerErr;
    }

    // 8. 기본 경로 처리
    app.get("/", (req, res) => res.redirect("/dashboard"));
    app.get("/dashboard", (req, res) =>
      res.sendFile(path.join(__dirname, "public", "dashboard.html"))
    );

    console.log("✅ 서버 초기화 완료");
    return app;
  } catch (err) {
    console.error("❌ 서버 초기화 중 에러 발생:", err);
    process.exit(1);
  }
}

// 단독 실행일 때만 서버 시작
if (require.main === module) {
  initApp()
    .then(() => {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("❌ 서버 시작 실패:", err);
    });
}

module.exports = { app, initApp };

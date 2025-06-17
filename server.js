require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const methodOverride = require("method-override");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const flash = require("connect-flash");
const { connectDB } = require("./config/db");
const mainRouter = require("./routes");

const app = express();

async function initApp() {
  // 1. MongoDB 연결
  const db = await connectDB();
  app.locals.db = db;

  // 2. Passport 설정
  require("./config/passport")(passport, db);

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

  // 4. 기본 설정
  app.use(express.static(path.join(__dirname, "public")));
  app.set("view engine", "ejs");
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(methodOverride("_method"));

  // 5. 세션, Passport, Flash
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
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

  // 6. 전역 변수
  app.use(async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const logoDoc = await db.collection("homepage").findOne({ key: "logo" });
      const bannerDocs = await db
        .collection("homepage")
        .find({ key: /^banner/ })
        .sort({ key: 1 })
        .toArray();
      res.locals.logo = logoDoc?.img || "";
      res.locals.banners = bannerDocs.map((b) => b.img);
    } catch (err) {
      console.error("❌ 로고/배너 조회 실패:", err);
      res.locals.logo = "";
      res.locals.banners = [];
    }
    res.locals.유저 = req.user || null;
    res.locals.currentUrl = req.originalUrl;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
  });

  // 7. 라우터 연결
  app.use("/", mainRouter);

  // 8. 기본 경로 처리
  app.get("/", (req, res) => res.redirect("/dashboard"));
  app.get("/dashboard", (req, res) => {
    const menus = ["/stock", "/list", "/write"];
    const menuLabels = {
      "/stock": "\ud83d\udce6 \uc7ac\uace0 \uad00\ub9ac",
      "/list": "\ud83d\udccb \uac8c\uc2dc\uad8c \ubaa9\ub85d",
      "/write": "\u270d \uae00 \uc791\uc131",
    };
    res.render("dashboard.ejs", {
      menus,
      menuLabels,
      banners: res.locals.banners,
    });
  });

  console.log("✅ 서버 초기화 완료");
  return app;
}

if (require.main === module) {
  initApp().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 서버 실행 중: http://localhost:${PORT}`));
  });
}

module.exports = { app, initApp };

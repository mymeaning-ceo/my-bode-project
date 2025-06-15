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
const expressLayouts = require("express-ejs-layouts");
const flash = require("connect-flash");               // ★ 추가
const { connectDB } = require("./config/db");

const app = express();

async function initApp() {
  const db = await connectDB();
  app.locals.db = db;

  require("./config/passport")(passport, db);

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
  app.use(express.static(path.join(__dirname, "public")));
  app.set("view engine", "ejs");
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(methodOverride("_method"))
  app.use((req, res, next) => {
  res.locals.currentUrl = req.originalUrl;
  next();
});


  
  app.use(methodOverride("_method"));
  app.use(expressLayouts);
  
  app.set("layout", "layouts/main");

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
  app.use(flash());                                   // ★ 추가

  // 전역 변수
  app.use((req, res, next) => {
    res.locals.유저 = req.user || null;
    res.locals.currentUrl = req.originalUrl;
    res.locals.logo = "";
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
  });

  // 라우터
  app.use("/api/stock", require("./routes/api/stockApi"));
  app.use("/stock", require("./routes/stock"));
  app.use("/", require("./routes/auth"));
  app.use("/admin", require("./routes/admin"));
  app.use("/board", require("./routes/board"));
  app.use("/coupang", require("./routes/coupang"));
  app.use("/coupang/add", require("./routes/coupangAdd"));
  app.use("/help", require("./routes/help"));

  // 기본/대시보드
  app.get("/", (req, res) => res.redirect("/dashboard"));
  app.get("/dashboard", (req, res) =>
    res.sendFile(path.join(__dirname, "public", "dashboard.html"))
  );

  console.log("✅ /api/stock 라우터 등록 완료");
  return app;
}

if (require.main === module) {
  initApp().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀  http://localhost:${PORT}`));
  });
}

module.exports = { app, initApp };

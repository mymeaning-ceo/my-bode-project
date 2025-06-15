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
const { connectDB } = require("./config/db"); // DB 연결 함수

const app = express();

async function initApp() {
  // 1) 데이터베이스 연결
  const db = await connectDB();        // connectDB() 성공 시 mongoose.connection.db 반환
  app.locals.db = db;

  require("./config/passport")(passport, db);

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
        ttl: 60 * 60
      }),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 1000
      }
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // 7) EJS 전역 변수
  app.use((req, res, next) => {
    res.locals.유저 = req.user || null;
    res.locals.currentUrl = req.originalUrl;
    res.locals.logo = "";
    next();
  });

  // 8) 라우터
  app.use("/api/stock", require("./routes/api/stockApi"));
  app.use("/stock", require("./routes/stock"));
  app.use("/", require("./routes/auth"));
  app.use("/admin", require("./routes/admin"));
  app.use("/board", require("./routes/board"));
  app.use("/coupang", require("./routes/coupang"));
  app.use("/coupang/add", require("./routes/coupangAdd"));
  app.use("/help", require("./routes/help"));
  app.get("/", (req, res) => res.redirect("/stock"));

  console.log("✅ /api/stock 라우터 등록 완료");
  return app; // 초기화 완료된 app 반환
}

if (require.main === module) {
  initApp().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀  http://localhost:${PORT}`));
  });
}

module.exports = { app, initApp };

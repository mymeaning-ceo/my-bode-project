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
const { initIndexes } = require("./config/initIndexes");
const apiRouter = require("./routes/api");
const errorHandler = require("./middlewares/errorHandler");
const { startCronJobs } = require("./services/cronJobs");

const app = express();

async function initApp() {
  const db = await connectDB();
  await initIndexes(db);
  app.locals.db = db;
  if (process.env.NODE_ENV !== 'test') {
    startCronJobs(db);
  }

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
  app.use(express.static(path.join(__dirname, "client", "build")));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(methodOverride("_method"));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "default_secret",
      resave: false,
      saveUninitialized: false,
      store: process.env.NODE_ENV === "test"
        ? undefined
        : MongoStore.create({
            mongoUrl: process.env.MONGO_URI || "mongodb://localhost:27017/testdb",
            dbName: process.env.DB_NAME || "testdb",
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

  app.use(async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const homepageColl = db?.collection?.("homepage");

      const logoDoc = await homepageColl?.findOne?.({ key: "logo" });

      let bannerDocs = [];
      if (typeof homepageColl?.find === "function") {
        let cursor = homepageColl.find({ key: /^banner/ });
        if (typeof cursor.sort === "function") {
          cursor = cursor.sort({ key: 1 });
        }
        if (typeof cursor.toArray === "function") {
          bannerDocs = await cursor.toArray();
        }
      }

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

  app.use("/api", apiRouter);

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
  });

  if (process.env.NODE_ENV !== "production") {
    app._router.stack
      .filter((r) => r.route)
      .forEach((r) =>
        console.log(`[ROUTE] ${Object.keys(r.route.methods)} ${r.route.path}`)
      );
  }


  app.use(errorHandler);

  console.log("✅ 서버 초기화 완료");
  return app;
}

// ─────────────────────────────
// 서버 실행 조건 분기
// ─────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  initApp().then(() => {
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
    }
  });
}

module.exports = { app, initApp };

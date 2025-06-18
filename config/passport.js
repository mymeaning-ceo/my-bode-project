// config/passport.js
const LocalStrategy = require("passport-local").Strategy;
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

module.exports = (passport, db) => {
  // ─────────────────────────────────────────
  // 1) Local Strategy
  // ─────────────────────────────────────────
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // 대소문자 무시 정규식 조회
        const user = await db
          .collection("user")
          .findOne({ username: new RegExp(`^${username}$`, "i") });

        console.log("DEBUG user:", user);

        if (!user) {
          return done(null, false, { message: "아이디 없음" });
        }

        const match = await bcrypt.compare(password, user.password);
        console.log("DEBUG password match:", match);

        if (!match) {
          return done(null, false, { message: "비밀번호 불일치" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // ─────────────────────────────────────────
  // 2) 세션 직렬화
  // ─────────────────────────────────────────
  passport.serializeUser((user, done) => {
    console.log("serializeUser:", user.username);
    done(null, user._id.toString());
  });

  // ─────────────────────────────────────────
  // 3) 세션 역직렬화
  // ─────────────────────────────────────────
  passport.deserializeUser(async (id, done) => {
    try {
      const dbUser = await db
        .collection("user")
        .findOne({ _id: new ObjectId(id) });

      console.log("deserializeUser:", dbUser?.username);

      if (dbUser) delete dbUser.password;
      done(null, dbUser);
    } catch (err) {
      done(err);
    }
  });
};

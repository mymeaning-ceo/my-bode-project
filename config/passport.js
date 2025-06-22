// config/passport.js
const LocalStrategy = require("passport-local").Strategy;
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

console.log("📥 passport.js 로딩 시작");

module.exports = (passport, db) => {
  console.log("🔧 passport 전략 설정 진입");

  // ─────────────────────────────────────────
  // 1) Local Strategy
  // ─────────────────────────────────────────
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("🔍 로그인 시도:", username);

        const user = await db
          .collection("users")
          .findOne({ username: new RegExp(`^${username}$`, "i") });

        console.log("🧾 사용자 조회 결과:", user);

        if (!user) {
          console.warn("❌ 아이디 없음");
          return done(null, false, { message: "아이디 없음" });
        }

        const match = await bcrypt.compare(password, user.password);
        console.log("🔐 비밀번호 일치 여부:", match);

        if (!match) {
          console.warn("❌ 비밀번호 불일치");
          return done(null, false, { message: "비밀번호 불일치" });
        }

        return done(null, user);
      } catch (err) {
        console.error("🚨 로그인 과정 중 오류:", err);
        return done(err);
      }
    })
  );

  // ─────────────────────────────────────────
  // 2) 세션 직렬화
  // ─────────────────────────────────────────
  passport.serializeUser((user, done) => {
    console.log("📦 serializeUser:", user.username);
    done(null, user._id.toString());
  });

  // ─────────────────────────────────────────
  // 3) 세션 역직렬화
  // ─────────────────────────────────────────
  passport.deserializeUser(async (id, done) => {
    try {
      console.log("🔄 deserializeUser 호출:", id);

      if (!ObjectId.isValid(id)) {
        console.warn("⚠️ 유효하지 않은 ObjectId:", id);
        return done(null, false);
      }

      const dbUser = await db
        .collection("users")
        .findOne({ _id: new ObjectId(id) });

      if (!dbUser) {
        console.warn("❌ 사용자 없음 (deserialize)");
        return done(null, false);
      }

      delete dbUser.password;
      console.log("✅ 사용자 세션 로드 완료:", dbUser.username);
      done(null, dbUser);
    } catch (err) {
      console.error("🚨 deserializeUser 에러:", err);
      done(err);
    }
  });

  console.log("✅ passport.js 설정 완료");
};

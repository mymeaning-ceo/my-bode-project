// config/passport.js
const LocalStrategy = require("passport-local").Strategy;
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

module.exports = (passport, db) => {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await db.collection("user").findOne({ username });
        if (!user) return done(null, false, { message: "아이디 없음" });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false, { message: "비밀번호 불일치" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, { id: user._id, username: user.username });
  });

  passport.deserializeUser(async (user, done) => {
    try {
      const dbUser = await db
        .collection("user")
        .findOne({ _id: new ObjectId(user.id) });
      if (dbUser) delete dbUser.password;
      done(null, dbUser);
    } catch (err) {
      done(err);
    }
  });
};

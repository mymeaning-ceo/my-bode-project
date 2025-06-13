const passport = require('passport');
const { ObjectId } = require('mongodb');

const user = await db.collection('users').findOne({ _id: new ObjectId(id) });

function checkLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

function checkAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user?.username === 'admin') {
    return next();
  } else {
    res.status(403).send('관리자만 접근 가능합니다.');
  }
}
// 예시: 로그인 시 세션에 저장하는 코드
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
  done(null, user); // ← 여기에서 req.user에 들어감
});


module.exports = { checkLogin, checkAdmin };
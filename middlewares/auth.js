function checkLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function checkAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user?.username === 'admin') {
    return next();
  }
  res.status(403).send('관리자만 접근 가능합니다.');
}

module.exports = { checkLogin, checkAdmin };

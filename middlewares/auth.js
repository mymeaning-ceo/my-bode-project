function checkLogin(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  if (typeof req.flash === 'function') {
    req.flash('error', '로그인이 필요합니다.');
  }
  return res.redirect('/login');
}

// Alias used by routers that require authentication
function checkAuth(req, res, next) {
  return checkLogin(req, res, next);
}

function checkAdmin(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).send('Forbidden');
  }
  if (typeof req.flash === 'function') {
    req.flash('error', '로그인이 필요합니다.');
  }
  return res.redirect('/login');
}

module.exports = { checkLogin, checkAdmin, checkAuth };

// Permission checks have been disabled to allow access to all routes.
// These middleware functions now simply pass control to the next handler.
function checkLogin(req, res, next) {
  if (!req.user) {
    if (req.path.startsWith('/api')) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }
    return res.redirect('/login');
  }
  next();
}

// Alias used by routers that require authentication
function checkAuth(req, res, next) {
  checkLogin(req, res, next);
}

function checkAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    if (req.path.startsWith('/api')) {
      return res.status(403).json({ message: '관리자 권한 필요' });
    }
    return res.status(403).send('관리자 권한 필요');
  }
  next();
}

module.exports = { checkLogin, checkAdmin, checkAuth };

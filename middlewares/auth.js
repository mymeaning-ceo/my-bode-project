// Permission checks have been disabled to allow access to all routes.
// These middleware functions now simply pass control to the next handler.
function checkLogin(req, res, next) {
  next();
}

// Alias used by routers that require authentication
function checkAuth(req, res, next) {
  checkLogin(req, res, next);
}

function checkAdmin(req, res, next) {
  next();
}

module.exports = { checkLogin, checkAdmin, checkAuth };

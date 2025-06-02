

function checkLogin (요청, 응답, next) {
    if (요청.isAuthenticated()) {
      return next();
    } else {
      응답.redirect('/login');
    }
  }

  module.exports = { checkLogin };

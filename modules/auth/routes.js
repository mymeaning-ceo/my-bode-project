const express = require('express');
const passport = require('passport');
const ctrl = require('./controller');
const router = express.Router();

router.get('/login', ctrl.showLogin);
router.get('/register', ctrl.showRegister);
router.post('/register', ctrl.register);

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).send('<script>alert("로그인 실패");history.back();</script>');
    req.logIn(user, err => {
      if (err) return next(err);
      res.redirect('/stock');
    });
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/login'));
});

module.exports = router;
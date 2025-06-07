app.get('/logout', (req, res, next) => {
    req.logout(err => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.redirect('/login');  // 또는 홈으로 이동
      });
    });
  });
  
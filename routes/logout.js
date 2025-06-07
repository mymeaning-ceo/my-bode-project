<<<<<<< HEAD
app.get('/logout', (req, res, next) => {
    req.logout(err => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.redirect('/login');  // 또는 홈으로 이동
      });
    });
  });
=======
app.get('/logout', (req, res, next) => {
    req.logout(err => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.redirect('/login');  // 또는 홈으로 이동
      });
    });
  });
>>>>>>> e64b824c86d54036124f4af898c95dcecdd5cd57
  
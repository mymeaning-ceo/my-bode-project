const bcrypt = require('bcrypt');

exports.login = async (req, res, next) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;
  try {
    const user = await db
      .collection('user')
      .findOne({ username: new RegExp(`^${username}$`, 'i') });

    if (!user) {
      return res.status(401).json({ success: false, message: '아이디 없음' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: '비밀번호 불일치' });
    }

    req.login(user, (err) => {
      if (err) return next(err);
      const { password: _pw, ...safeUser } = user;
      return res.json({ success: true, user: safeUser });
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  req.logout(() => res.json({ success: true }));
};

exports.getUser = (req, res) => {
  if (!req.user) return res.status(401).json({ user: null });
  const { password, ...safeUser } = req.user;
  res.json({ user: safeUser });
};

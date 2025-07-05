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
exports.register = async (req, res, next) => {
  const { username, name, email, password, password2 } = req.body;
  const db = req.app.locals.db;

  if (!username || !name || !email || !password || !password2) {
    return res.status(400).json({ success: false, message: '모든 항목을 입력해주세요.' });
  }
  if (password !== password2) {
    return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ success: false, message: '이메일 형식이 올바르지 않습니다.' });
  }

  try {
    const userExists = await db.collection('user').findOne({ username });
    if (userExists) {
      return res.status(400).json({ success: false, message: '이미 사용 중인 아이디입니다.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection('user').insertOne({
      username,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ 회원가입 오류:', err);
    next(err);
  }
};

exports.sessionInfo = (req, res) => {
  const { cookie } = req.session || {};
  const expires = cookie?.expires || new Date(Date.now() + (cookie?.maxAge || 0));
  res.json({ expiresAt: expires });
};

exports.extendSession = (req, res) => {
  if (req.session && req.session.cookie) {
    const maxAge = req.session.cookie.originalMaxAge || req.session.cookie.maxAge;
    req.session.cookie.expires = new Date(Date.now() + maxAge);
    if (typeof req.session.touch === 'function') {
      req.session.touch();
    }
  }
  res.json({ expiresAt: req.session?.cookie?.expires });
};

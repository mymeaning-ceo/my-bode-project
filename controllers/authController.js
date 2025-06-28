const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');

exports.renderLoginPage = (req, res) => {
  const reactIndex = path.join(__dirname, '..', 'client', 'public', 'index.html');
  res.sendFile(reactIndex);
};

exports.login = async (req, res, next) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;
  try {
    const user = await db
      .collection('user')
      .findOne({ username: new RegExp(`^${username}$`, 'i') });

    if (!user) {
      req.flash('error', '아이디 없음');
      return res.redirect('/login');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash('error', '비밀번호 불일치');
      return res.redirect('/login');
    }

    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect('/dashboard');
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  req.logout(() => res.redirect('/login'));
};

exports.renderRegisterPage = (req, res) => {
  res.render('register');
};

exports.register = async (req, res) => {
  const { username, name, email, password, password2 } = req.body;
  const db = req.app.locals.db;

  try {
    if (!username || !name || !email || !password || !password2) {
      req.flash('error', '모든 항목을 입력해주세요.');
      return res.redirect('/register');
    }
    if (password !== password2) {
      req.flash('error', '비밀번호가 일치하지 않습니다.');
      return res.redirect('/register');
    }
    if (!email.includes('@')) {
      req.flash('error', '이메일 형식이 올바르지 않습니다.');
      return res.redirect('/register');
    }

    const userExists = await db.collection('user').findOne({ username });
    if (userExists) {
      req.flash('error', '이미 사용 중인 아이디입니다.');
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection('user').insertOne({
      username,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    req.flash('success', '회원가입이 완료되었습니다. 로그인해주세요.');
    res.redirect('/login');
  } catch (err) {
    console.error('❌ 회원가입 오류:', err);
    req.flash('error', '서버 오류가 발생했습니다.');
    res.redirect('/register');
  }
};

exports.renderRegisterSuccess = (req, res) => {
  res.render('register-success');
};

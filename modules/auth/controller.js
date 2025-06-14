const bcrypt = require('bcrypt');

exports.showLogin = (req, res) => res.render('login', { logo: '', 유저: req.user || null });
exports.showRegister = (req, res) => res.render('register', { logo: '', 유저: req.user || null });

exports.register = async (req, res) => {
  const { username, name, email, password, password2 } = req.body;
  const db = req.app.locals.db;

  if (!username || !name || !email || !password || password !== password2) {
    return res.status(400).send('<script>alert("입력 오류");history.back();</script>');
  }

  const exists = await db.collection('users').findOne({ username });
  if (exists) return res.status(400).send('<script>alert("아이디 중복");history.back();</script>');

  const hash = await bcrypt.hash(password, 10);
  await db.collection('users').insertOne({ username, name, email, password: hash });
  res.redirect('/register-success');
};
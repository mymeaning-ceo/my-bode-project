<<<<<<< HEAD
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const connectDB = require('../database');

let db;
connectDB.then(client => db = client.db('forum'));

// 회원가입 처리
router.post('/register', async (req, res) => {
  const { username, name, email, password, password2 } = req.body;

  if (!username || !name || !email || !password || !password2) {
    return res.status(400).send('<script>alert("모든 항목을 입력해주세요.");history.back();</script>');
  }
  if (password !== password2) {
    return res.status(400).send('<script>alert("비밀번호가 일치하지 않습니다.");history.back();</script>');
  }
  if (!email.includes('@')) {
    return res.status(400).send('<script>alert("이메일 형식이 올바르지 않습니다.");history.back();</script>');
  }

  const userExists = await db.collection('users').findOne({ username });
  if (userExists) {
    return res.status(400).send('<script>alert("이미 사용 중인 아이디입니다.");history.back();</script>');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.collection('users').insertOne({ username, name, email, password: hashedPassword });
  res.redirect('/register-success');
});

module.exports = router;
=======
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const connectDB = require('../database');

let db;
connectDB.then(client => db = client.db('forum'));

// 회원가입 처리
router.post('/register', async (req, res) => {
  const { username, name, email, password, password2 } = req.body;

  if (!username || !name || !email || !password || !password2) {
    return res.status(400).send('<script>alert("모든 항목을 입력해주세요.");history.back();</script>');
  }
  if (password !== password2) {
    return res.status(400).send('<script>alert("비밀번호가 일치하지 않습니다.");history.back();</script>');
  }
  if (!email.includes('@')) {
    return res.status(400).send('<script>alert("이메일 형식이 올바르지 않습니다.");history.back();</script>');
  }

  const userExists = await db.collection('users').findOne({ username });
  if (userExists) {
    return res.status(400).send('<script>alert("이미 사용 중인 아이디입니다.");history.back();</script>');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.collection('users').insertOne({ username, name, email, password: hashedPassword });
  res.redirect('/register-success');
});

module.exports = router;
>>>>>>> e64b824c86d54036124f4af898c95dcecdd5cd57

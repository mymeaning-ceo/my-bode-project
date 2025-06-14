const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { connectDB } = require('../config/db'); // 구조분해 할당

let db;
connectDB().then((client) => {
  db = client.db('forum');
});

// -----------------------------
// 1) 로그인 페이지
// -----------------------------
router.get('/login', (req, res) => {
  res.render('login'); // views/login.ejs
});

// -----------------------------
// 2) 회원가입 페이지
// -----------------------------
router.get('/register', (req, res) => {
  res.render('register'); // views/register.ejs
});

// -----------------------------
// 3) 회원가입 처리
// -----------------------------
router.post('/register', async (req, res) => {
  const { username, name, email, password, password2 } = req.body;

  // ... (유효성 검사 및 DB 로직은 기존 코드 유지)
});

// -----------------------------
// 4) 회원가입 성공 페이지
// -----------------------------
router.get('/register-success', (req, res) => {
  res.render('register-success'); // views/register-success.ejs
});

module.exports = router;
// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");

const router = express.Router();

// ────────────────────────────────────────────────
// 1) app.locals.db 가져오는 헬퍼 (중복 연결 방지)
// ────────────────────────────────────────────────
const getDB = (req) => {
  if (!req.app.locals.db) {
    throw new Error("DB 연결이 아직 초기화되지 않았습니다.");
  }
  return req.app.locals.db;
};

// ─────────── 로그인 페이지 ───────────
router.get("/login", (req, res) => {
  res.render("login");
});

// ─────────── 로그인 처리 ───────────
router.post("/login", async (req, res, next) => {
  const db = getDB(req);
  const { username, password } = req.body;

  try {
    const user = await db
      .collection("user")
      .findOne({ username: new RegExp(`^${username}$`, "i") });

    if (!user) {
      req.flash("error", "아이디 없음");
      return res.redirect("/login");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash("error", "비밀번호 불일치");
      return res.redirect("/login");
    }

    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect("/dashboard");
    });
  } catch (err) {
    next(err);
  }
});

// ─────────── 로그아웃 ───────────
router.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/login"));
});

// ─────────── 회원가입 페이지 ───────────
router.get("/register", (req, res) => {
  res.render("register");
});

// ─────────── 회원가입 처리 ───────────
router.post("/register", async (req, res) => {
  const { username, name, email, password, password2 } = req.body;
  const db = getDB(req); // ← 단일 커넥션 사용

  try {
    // ① 유효성 검사
    if (!username || !name || !email || !password || !password2) {
      req.flash("error", "모든 항목을 입력해주세요.");
      return res.redirect("/register");
    }
    if (password !== password2) {
      req.flash("error", "비밀번호가 일치하지 않습니다.");
      return res.redirect("/register");
    }
    if (!email.includes("@")) {
      req.flash("error", "이메일 형식이 올바르지 않습니다.");
      return res.redirect("/register");
    }

    // ② 중복 아이디 확인
    const userExists = await db.collection("user").findOne({ username });
    if (userExists) {
      req.flash("error", "이미 사용 중인 아이디입니다.");
      return res.redirect("/register");
    }

    // ③ 비밀번호 해시 후 저장
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection("user").insertOne({
      username,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    req.flash("success", "회원가입이 완료되었습니다. 로그인해주세요.");
    res.redirect("/login");
  } catch (err) {
    console.error("❌ 회원가입 오류:", err);
    req.flash("error", "서버 오류가 발생했습니다.");
    res.redirect("/register");
  }
});

// ─────────── 회원가입 성공 페이지 (선택) ───────────
router.get("/register-success", (req, res) => {
  res.render("register-success");
});

module.exports = router;

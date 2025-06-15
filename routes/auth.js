const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const router = express.Router();
const { connectDB } = require("../config/db");

// DB 연결
let db;
connectDB()
  .then((clientDb) => {
    db = clientDb;
  })
  .catch((err) => console.error("❌ DB 연결 실패:", err));

// 로그인 페이지
router.get("/login", (req, res) => {
  res.render("login");
});

// 로그인 처리
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// 로그아웃
router.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/login"));
});

// 회원가입 페이지
router.get("/register", (req, res) => {
  res.render("register");
});

// 회원가입 처리
router.post("/register", async (req, res) => {
  const { username, name, email, password, password2 } = req.body;

  try {
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

    const userExists = await db.collection("users").findOne({ username });
    if (userExists) {
      req.flash("error", "이미 사용 중인 아이디입니다.");
      return res.redirect("/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
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

// 회원가입 성공 페이지 (선택)
router.get("/register-success", (req, res) => {
  res.render("register-success");
});

module.exports = router;
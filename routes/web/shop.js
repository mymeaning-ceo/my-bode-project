const express = require("express");
const { searchPosts } = require("../../services/searchService");
const router = express.Router();

// 🔹 검색 라우트 (GET /search?val=...&page=...)
router.get("/", async (req, res) => {
  const db = req.app.locals.db;
  const val = req.query.val?.trim();
  if (!val) return res.redirect("/list");

  const page = parseInt(req.query.page || "1");
  const limit = 5;

  try {
    const { docs, totalPage } = await searchPosts(db, val, page, limit);
    res.render("search.ejs", {
      글목록: docs,
      현재페이지: page,
      전체페이지: totalPage,
      val,
    });
  } catch (err) {
    console.error("❌ 검색 오류:", err);
    res.status(500).send("서버 오류");
  }
});

module.exports = router;

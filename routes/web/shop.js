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
  const sortField =
    ["title", "createdAt"].includes(req.query.sort)
      ? req.query.sort
      : "createdAt";
  const sortOrder = req.query.order === "asc" ? 1 : -1;

  try {
    const { docs, totalPage } = await searchPosts(
      db,
      val,
      page,
      limit,
      sortField,
      sortOrder
    );
    const baseParams = new URLSearchParams({ val });
    if (sortField !== "createdAt") baseParams.append("sort", sortField);
    if (req.query.order) baseParams.append("order", req.query.order);
    const baseQuery = baseParams.toString();
    res.render("search.ejs", {
      글목록: docs,
      현재페이지: page,
      전체페이지: totalPage,
      val,
      sortField,
      sortOrder,
      기본쿼리: baseQuery,
    });
  } catch (err) {
    console.error("❌ 검색 오류:", err);
    res.status(500).send("서버 오류");
  }
});

module.exports = router;

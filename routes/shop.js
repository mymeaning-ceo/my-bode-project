const express = require("express");
const router = express.Router();

// 🔹 검색 라우트 (GET /search?val=...&page=...)
router.get("/", async (req, res) => {
  const db = req.app.locals.db; // 서버에서 저장한 DB 인스턴스 사용
  const val = req.query.val?.trim();
  if (!val) return res.redirect("/list");

  const page = parseInt(req.query.page || "1");
  const limit = 5;
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $search: {
        index: "title_index",
        text: {
          query: val,
          path: "title",
        },
      },
    },
    { $skip: skip },
    { $limit: limit },
  ];

  const countPipeline = [
    {
      $search: {
        index: "title_index",
        text: {
          query: val,
          path: "title",
        },
      },
    },
    { $count: "total" },
  ];

  try {
    const result = await db.collection("post").aggregate(pipeline).toArray();
    const countResult = await db
      .collection("post")
      .aggregate(countPipeline)
      .toArray();

    const total = countResult[0]?.total || 0;
    const totalPage = Math.ceil(total / limit);

    res.render("search.ejs", {
      글목록: result,
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
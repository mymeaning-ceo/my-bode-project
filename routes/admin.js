const express = require("express");
const router = express.Router();
const upload = require("../upload.js");
const { checkLogin, checkAdmin } = require("../middlewares/auth");
const { ObjectId } = require("mongodb");

let db;
const connectDB = require("../database");
connectDB.then((client) => (db = client.db("forum")));

// 관리자 페이지 화면
router.get("/", checkAdmin, async (req, res) => {
  const logo = await db.collection("homepage").findOne({ key: "logo" });
  const banners = [];
  for (let i = 1; i <= 4; i++) {
    const doc = await db.collection("homepage").findOne({ key: "banner" + i });
    banners.push(doc?.img || "");
  }
  res.render("admin/index.ejs", {
    banners,
    logo: logo?.img || "",
  });
});

// 배너 이미지 업로드
router.post(
  "/banner/:idx",
  upload.single("banner"),
  async (req, res) => {
    const imgLocation = req.file ? req.file.location : "";
    const idx = req.params.idx;
    await db
      .collection("homepage")
      .updateOne(
        { key: "banner" + idx },
        { $set: { img: imgLocation, updatedAt: new Date() } },
        { upsert: true },
      );
    res.redirect("/admin");
  },
);

      await db.collection("banners").updateOne(
        { idx },
        { $set: { img: imgLocation } },
        { upsert: true }
      );

// 로고 이미지 삭제
router.post("/logo/delete", checkAdmin, async (req, res) => {
  await db.collection("homepage").deleteOne({ key: "logo" });
  res.redirect("/admin");
});

// ===== 뷰 접근 권한 설정 =====
const managedViews = [
  "/stock",
  "/coupang",
  "/list",
  "/write",
  "/list/write",
  "/admin",
  "/ocr",
  "/voucher",
];

router.get("/permissions", checkAdmin, async (req, res) => {
  const docs = await db.collection("permissions").find().toArray();
  const permissions = {};
  docs.forEach((d) => {
    permissions[d.view] = {
      loginRequired: d.loginRequired,
      allowedUsers: d.allowedUsers || [],
    };
  });

  const users = await db
    .collection("user")
    .find({}, { projection: { username: 1 } })
    .toArray();
  res.render("admin/permissions.ejs", {
    views: managedViews,
    permissions,
    users,
  });
});

router.post("/permissions", checkAdmin, async (req, res) => {
  const selected = req.body.view || [];
  const arr = Array.isArray(selected) ? selected : [selected];
  await Promise.all(
    managedViews.map((v) => {
      const loginRequired = arr.includes(v);
      const users = req.body["user_" + v];
      const allowedUsers = Array.isArray(users) ? users : users ? [users] : [];
      return db
        .collection("permissions")
        .updateOne(
          { view: v },
          { $set: { view: v, loginRequired, allowedUsers } },
          { upsert: true },
        );
    }),
  );
  if (global.loadPermissions) await global.loadPermissions();
  res.redirect("/admin/permissions");
});

// ===== 사용자 관리 =====
router.get("/users", checkAdmin, async (req, res) => {
  const q = req.query.q || "";
  const query = q ? { username: { $regex: q, $options: "i" } } : {};
  const users = await db
    .collection("user")
    .find(query, { projection: { password: 0 } })
    .sort({ username: 1 })
    .toArray();
  res.render("admin/users.ejs", { users, q });
});

router.post("/users/delete", checkAdmin, async (req, res) => {
  const id = req.body.userId;
  if (id) {
    await db.collection("user").deleteOne({ _id: new ObjectId(id) });
  }
  res.redirect("/admin/users");
});

module.exports = router;
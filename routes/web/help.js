const express = require("express");
const path = require("path");
const router = express.Router();

router.get("/", (req, res) => {
  const reactIndex = path.join(__dirname, "../../client/public/index.html");
  res.sendFile(reactIndex);
});

module.exports = router;

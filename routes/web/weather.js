const express = require('express');
const router = express.Router();
const { checkAuth } = require('../../middlewares/auth');
const path = require('path');
const fs = require('fs');

router.get('/*', checkAuth, (req, res) => {
  const buildPath = path.join(__dirname, '../../client/build', 'index.html');
  const publicPath = path.join(__dirname, '../../client/public', 'index.html');
  const indexPath = fs.existsSync(buildPath) ? buildPath : publicPath;
  res.sendFile(indexPath);
});

module.exports = router;

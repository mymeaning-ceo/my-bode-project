const express = require('express');
const router = express.Router();
const { checkAuth } = require('../../middlewares/auth');
const path = require('path');

router.get('/*', checkAuth, (req, res) => {
  const indexPath = path.join(__dirname, '../../client/public', 'index.html');
  res.sendFile(indexPath);
});

module.exports = router;

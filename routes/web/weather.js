const express = require('express');
const router = express.Router();
const { checkAuth } = require('../../middlewares/auth');

router.get('/', checkAuth, (req, res) => {
  res.render('weather');
});

module.exports = router;

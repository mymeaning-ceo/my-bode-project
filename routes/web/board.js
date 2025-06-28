const path = require('path');
const router = require('express').Router();

// React 페이지 제공
router.get('/', (req, res) => {
  const reactIndex = path.join(__dirname, '..', '..', 'client', 'public', 'index.html');
  res.sendFile(reactIndex);
});

module.exports = router;

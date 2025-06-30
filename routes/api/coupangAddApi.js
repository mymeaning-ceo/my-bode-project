const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/coupangAddController');

router.get('/', ctrl.getData);
router.get('/:id', ctrl.getItem);
router.post('/upload', ctrl.upload, ctrl.uploadExcelApi);
router.put('/:id', ctrl.updateItem);
router.delete('/', async (req, res) => {
  const db = req.app.locals.db;
  await db.collection('coupangAdd').deleteMany({});
  res.json({ message: '삭제 완료' });
});

module.exports = router;

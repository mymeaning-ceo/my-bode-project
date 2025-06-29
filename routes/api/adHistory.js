const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/adHistoryController');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.detail);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/recordController');

router.post('/:collection', ctrl.create);
router.get('/:collection/:id', ctrl.get);
router.put('/:collection/:id', ctrl.update);
router.delete('/:collection/:id', ctrl.remove);

module.exports = router;

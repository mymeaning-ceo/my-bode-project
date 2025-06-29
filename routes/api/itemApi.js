const express = require('express');
const router = express.Router();
const itemCtrl = require('../../controllers/itemController');

router.get('/', itemCtrl.listItems);
router.get('/:id', itemCtrl.getItem);
router.post('/', itemCtrl.createItem);
router.put('/:id', itemCtrl.updateItem);

module.exports = router;

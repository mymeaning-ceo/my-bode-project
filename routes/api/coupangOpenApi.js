const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/coupangOpenController');

router.get('/product/:id', ctrl.getProduct);

module.exports = router;

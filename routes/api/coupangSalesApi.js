const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/coupangSalesController');

router.get('/', ctrl.getAll);
router.get('/fetch', ctrl.fetchPayouts);

module.exports = router;

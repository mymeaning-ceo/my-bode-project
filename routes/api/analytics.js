const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/analyticsController');

router.get('/', ctrl.getMetrics);

module.exports = router;

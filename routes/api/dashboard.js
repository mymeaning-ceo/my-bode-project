const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/dashboardController');

router.get('/ad-cost-daily', ctrl.getDailyAdCost);

module.exports = router;

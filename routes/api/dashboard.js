const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/dashboardController');

router.get('/ad-cost-daily', ctrl.getDailyAdCost);
router.get('/sales-ad-summary', ctrl.getDailySalesAdSummary);

router.get('/city-temp', ctrl.getCityTempHistory);
router.post('/city-temp', ctrl.saveCityTemp);

module.exports = router;

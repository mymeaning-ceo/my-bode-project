const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/weatherController');

router.get('/daily', ctrl.getDailyWeather);
router.get('/summary', ctrl.getWeatherSummary);
router.get('/date/:date', ctrl.getWeatherByDate);
router.get('/range', ctrl.getWeatherRange);
router.get('/same-day', ctrl.getWeatherSameDay);

module.exports = router;

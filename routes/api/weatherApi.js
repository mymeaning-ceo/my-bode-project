const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/weatherController');

router.post('/upload', ctrl.upload, ctrl.uploadExcelApi);
router.get('/history', ctrl.getHistory);
router.post('/record', ctrl.createWeather);
router.put('/record/:id', ctrl.updateWeather);
router.get('/record/:id', ctrl.getWeatherRecord);
router.get('/daily', ctrl.getDailyWeather);
router.get('/same-day', ctrl.getSameDay);
router.get('/monthly', ctrl.getMonthlyWeather);
router.get('/monthly-db', ctrl.getMonthlyWeatherFromDb);
router.get('/average', ctrl.getAverageTemperature);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/weatherController');
const upload = require('../../upload');

router.get('/daily', ctrl.getDailyWeather);
router.get('/same-day', ctrl.getSameDay);
router.get('/monthly', ctrl.getMonthlyWeather);
router.get('/average', ctrl.getAverageTemperature);
router.post('/upload', upload.single('excelFile'), ctrl.uploadMonthlyExcel);
router.get('/history', ctrl.getHistory);

module.exports = router;

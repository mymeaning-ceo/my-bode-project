const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/weatherController');

router.get('/daily', ctrl.getDailyWeather);
router.get('/meteostat', ctrl.getMeteostatWeather);

module.exports = router;

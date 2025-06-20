const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/weatherController');

router.get('/daily', ctrl.getDailyWeather);

module.exports = router;

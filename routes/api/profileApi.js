const express = require('express');
const router = express.Router();
const controller = require('../../controllers/apiProfileController');

router.get('/', controller.getProfile);
router.post('/', controller.updateProfile);

module.exports = router;

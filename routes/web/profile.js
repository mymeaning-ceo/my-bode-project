const express = require('express');
const router = express.Router();
const controller = require('../../controllers/profileController');

router.get('/', controller.renderProfilePage);
router.post('/', controller.updateProfile);

module.exports = router;

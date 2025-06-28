const express = require('express');
const router = express.Router();
const controller = require('../../controllers/apiAuthController');

router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/user', controller.getUser);

module.exports = router;

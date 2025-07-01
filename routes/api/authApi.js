const express = require('express');
const router = express.Router();
const controller = require('../../controllers/apiAuthController');

router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/logout', controller.logout);
router.get('/user', controller.getUser);
router.get('/session', controller.sessionInfo);

module.exports = router;

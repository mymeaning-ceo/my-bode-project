const express = require('express');
const router = express.Router();
const { checkAdmin } = require('../../middlewares/auth');
const ctrl = require('../../controllers/adminApiController');

router.get('/users', checkAdmin, ctrl.listUsers);
router.delete('/users/:id', checkAdmin, ctrl.deleteUser);
router.get('/permissions', checkAdmin, ctrl.getPermissions);
router.post('/permissions', checkAdmin, ctrl.savePermissions);

module.exports = router;

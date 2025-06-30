const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/coupangSupplyController');

router.get('/', ctrl.getList);
router.post('/upload', ctrl.upload, ctrl.uploadExcel);
router.get('/download', ctrl.downloadExcel);

module.exports = router;

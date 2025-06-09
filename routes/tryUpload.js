const express = require('express');
const multer  = require('multer');
const { uploadAndProcess } = require('../controllers/tryController');

const router = express.Router();
const upload = multer({ dest: '/tmp/try_uploads' });

// POST /api/try/upload
router.post('/upload', upload.single('file'), uploadAndProcess);

module.exports = router;

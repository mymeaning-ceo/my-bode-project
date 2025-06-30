const express = require('express');
const path = require('path');
const router = express.Router();
const upload = require('../../upload.js');
const postController = require('../../controllers/postController');

// React page routes
// Serve React pages without redirecting when trailing slash is omitted
router.get(['', '/', '/:page', '/write', '/detail/:id', '/edit/:id'], (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/public/index.html'));
});

// API actions remain
router.post('/add', upload.single('img1'), postController.addPost);
router.put('/edit', postController.updatePost);
router.delete('/delete', postController.deletePost);
router.post('/comment/add', postController.addComment);
router.put('/comment/edit', postController.editComment);
router.delete('/comment/delete', postController.deleteComment);

module.exports = router;

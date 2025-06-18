const express = require('express');
const router = express.Router();
const upload = require('../../upload.js');
const postController = require('../../controllers/postController');

router.get(['/', '/:page'], postController.listPosts);
router.get('/write', postController.renderWritePage);
router.post('/add', upload.single('img1'), postController.addPost);
router.get('/detail/:id', postController.viewPost);
router.get('/edit/:id', postController.renderEditPage);
router.put('/edit', postController.updatePost);
router.delete('/delete', postController.deletePost);
router.post('/comment/add', postController.addComment);
router.put('/comment/edit', postController.editComment);
router.delete('/comment/delete', postController.deleteComment);

module.exports = router;

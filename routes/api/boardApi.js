const router = require('express').Router();
const boardController = require('../../controllers/boardApiController');

router.get('/:board/posts', boardController.getPosts);
router.post('/:board/posts', boardController.addPost);

module.exports = router;

const router = require('express').Router();
const ctrl = require('../../controllers/commentApiController');

router.get('/:postId', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;

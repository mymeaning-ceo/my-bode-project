const { ObjectId } = require('mongodb');
const asyncHandler = require('../middlewares/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const comments = await db
    .collection('comment')
    .find({ postId: new ObjectId(req.params.postId) })
    .sort({ createdAt: 1 })
    .toArray();
  res.json(comments);
});

exports.create = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const db = req.app.locals.db;
  const doc = {
    postId: new ObjectId(req.body.postId),
    content: req.body.content,
    user: req.user._id,
    username: req.user.username,
    createdAt: new Date(),
  };
  await db.collection('comment').insertOne(doc);
  res.json({ success: true });
});

exports.update = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const db = req.app.locals.db;
  const result = await db.collection('comment').updateOne(
    { _id: new ObjectId(req.params.id), user: req.user._id },
    { $set: { content: req.body.content } },
  );
  if (result.matchedCount === 0)
    return res.status(403).json({ message: '수정 권한이 없습니다.' });
  res.json({ success: true });
});

exports.remove = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const db = req.app.locals.db;
  const result = await db.collection('comment').deleteOne({
    _id: new ObjectId(req.params.id),
    user: req.user._id,
  });
  if (result.deletedCount === 0)
    return res.status(403).json({ message: '삭제 권한이 없습니다.' });
  res.json({ success: true });
});

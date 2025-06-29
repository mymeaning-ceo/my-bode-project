const { ObjectId } = require('mongodb');
const asyncHandler = require('../middlewares/asyncHandler');
const { getPostCollection } = require('../utils/postCollection');

// 게시글 목록 조회
exports.list = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search;
  const board = req.query.board || 'default';
  const postsCol = getPostCollection(db, board);
  let query = { board };
  if (search) {
    query = {
      $and: [
        { board },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
          ],
        },
      ],
    };
  }
  const [posts, total] = await Promise.all([
    postsCol
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    postsCol.countDocuments(query),
  ]);
  res.json({ data: posts, total });
});

// 게시글 작성
exports.create = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const db = req.app.locals.db;
  const doc = {
    title: req.body.title,
    content: req.body.content,
    board: req.body.board || 'default',
    user: req.user._id,
    username: req.user.username,
    createdAt: new Date(),
  };
  const postsCol = getPostCollection(db, doc.board);
  await postsCol.insertOne(doc);
  res.json({ success: true });
});

// 게시글 상세 조회
exports.detail = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const board = req.query.board || 'default';
  const postsCol = getPostCollection(db, board);
  const post = await postsCol.findOne({ _id: new ObjectId(req.params.id) });
  if (!post) return res.status(404).json({ message: '존재하지 않는 게시글입니다.' });
  res.json(post);
});

// 게시글 수정
exports.update = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const db = req.app.locals.db;
  const board = req.body.board || 'default';
  const postsCol = getPostCollection(db, board);
  const result = await postsCol.updateOne(
    { _id: new ObjectId(req.params.id), user: req.user._id },
    { $set: { title: req.body.title, content: req.body.content } },
  );
  if (result.matchedCount === 0)
    return res.status(403).json({ message: '수정 권한이 없습니다.' });
  res.json({ success: true });
});

// 게시글 삭제
exports.remove = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const db = req.app.locals.db;
  const board = req.query.board || 'default';
  const postsCol = getPostCollection(db, board);
  const result = await postsCol.deleteOne({
    _id: new ObjectId(req.params.id),
    user: req.user._id,
  });
  if (result.deletedCount === 0)
    return res.status(403).json({ message: '삭제 권한이 없거나 존재하지 않습니다.' });
  res.json({ success: true });
});

const { ObjectId } = require('mongodb');
const asyncHandler = require('../middlewares/asyncHandler');

// 게시판 목록 조회
exports.list = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const boards = await db
    .collection('board')
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  res.json(boards);
});

// 게시판 생성
exports.create = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const db = req.app.locals.db;
  const doc = {
    name: req.body.name,
    slug: req.body.slug,
    description: req.body.description || '',
    createdAt: new Date(),
  };
  await db.collection('board').insertOne(doc);
  res.json({ success: true });
});

// 게시판 상세 조회
exports.detail = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const board = await db
    .collection('board')
    .findOne({ _id: new ObjectId(req.params.id) });
  if (!board) return res.status(404).json({ message: '존재하지 않는 게시판입니다.' });
  res.json(board);
});

// 게시판 수정
exports.update = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const db = req.app.locals.db;
  const result = await db.collection('board').updateOne(
    { _id: new ObjectId(req.params.id) },
    {
      $set: {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description || '',
      },
    },
  );
  if (result.matchedCount === 0)
    return res.status(404).json({ message: '존재하지 않는 게시판입니다.' });
  res.json({ success: true });
});

// 게시판 삭제
exports.remove = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const db = req.app.locals.db;
  const result = await db.collection('board').deleteOne({
    _id: new ObjectId(req.params.id),
  });
  if (result.deletedCount === 0)
    return res.status(404).json({ message: '존재하지 않는 게시판입니다.' });
  res.json({ success: true });
});

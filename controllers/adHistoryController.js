const { ObjectId } = require('mongodb');
const asyncHandler = require('../middlewares/asyncHandler');

// 광고 내역 목록 조회
exports.list = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const rows = await db
    .collection('adHistory')
    .find()
    .sort({ date: -1 })
    .toArray();
  res.json(rows);
});

// 광고 내역 생성
exports.create = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const doc = {
    date: req.body.date || new Date().toISOString().slice(0, 10),
    campaign: req.body.campaign || '',
    clicks: Number(req.body.clicks) || 0,
    cost: Number(req.body.cost) || 0,
    createdAt: new Date(),
  };
  await db.collection('adHistory').insertOne(doc);
  res.json({ success: true });
});

// 광고 내역 상세 조회
exports.detail = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const row = await db
    .collection('adHistory')
    .findOne({ _id: new ObjectId(req.params.id) });
  if (!row) return res.status(404).json({ message: 'Not found' });
  res.json(row);
});

// 광고 내역 수정
exports.update = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const result = await db.collection('adHistory').updateOne(
    { _id: new ObjectId(req.params.id) },
    {
      $set: {
        date: req.body.date,
        campaign: req.body.campaign,
        clicks: Number(req.body.clicks),
        cost: Number(req.body.cost),
      },
    },
  );
  if (result.matchedCount === 0)
    return res.status(404).json({ message: 'Not found' });
  res.json({ success: true });
});

// 광고 내역 삭제
exports.remove = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const result = await db
    .collection('adHistory')
    .deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 0)
    return res.status(404).json({ message: 'Not found' });
  res.json({ success: true });
});

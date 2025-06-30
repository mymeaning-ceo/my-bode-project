const asyncHandler = require('../middlewares/asyncHandler');

// GET /api/dashboard/ad-cost-daily
// Return daily sum of Coupang ad cost
exports.getDailyAdCost = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const pipeline = [
    {
      $group: {
        _id: '$날짜',
        totalCost: { $sum: '$광고비' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        totalCost: 1,
      },
    },
  ];
  const data = await db.collection('coupangAdd').aggregate(pipeline).toArray();
  res.json(data);
});

const asyncHandler = require('../middlewares/asyncHandler');

async function aggregateMetrics(db) {
  const pipeline = [
    {
      $group: {
        _id: '$optionId',
        impressions: { $sum: '$impressions' },
        clicks: { $sum: '$clicks' },
        adCost: { $sum: '$adCost' },
        ctr: { $avg: '$ctr' },
        cpc: { $avg: '$cpc' },
      },
    },
    {
      $project: {
        _id: 0,
        optionId: '$_id',
        impressions: 1,
        clicks: 1,
        adCost: 1,
        ctr: 1,
        cpc: 1,
      },
    },
  ];
  return db.collection('adMetrics').aggregate(pipeline).toArray();
}

exports.getMetrics = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const data = await aggregateMetrics(db);
  res.json(data);
});

exports.renderPage = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const metrics = await aggregateMetrics(db);
  res.render('analytics', { metrics });
});

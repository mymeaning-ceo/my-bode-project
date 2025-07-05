const asyncHandler = require('../middlewares/asyncHandler');

// GET /api/dashboard/ad-cost-daily
// Return daily sum of Coupang ad cost
exports.getDailyAdCost = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const pipeline = [
    {
      $group: {
        _id: '$date',
        totalCost: { $sum: { $toDouble: '$cost' } },
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
  const data = await db.collection('adHistory').aggregate(pipeline).toArray();
  res.json(data);
});

// GET /api/dashboard/city-temp
// Return hourly temperature for a given city (stored in DB)
exports.getCityTempHistory = asyncHandler(async (req, res) => {
  const city = (req.query.city || 'seoul').toLowerCase();
  const db = req.app.locals.db;

  const data = await db
    .collection('cityWeather')
    .find({ city })
    .sort({ time: 1 })
    .toArray();

  const result = data.map((d) => ({
    time: d.time,
    temperature: d.temperature,
  }));

  res.json(result);
});

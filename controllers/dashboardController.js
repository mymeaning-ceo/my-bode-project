const asyncHandler = require('../middlewares/asyncHandler');
const { fetchDaily } = require('./weatherController');
const cityCoords = require('../data/cityCoords.json');

function getDefaultBaseDateTime() {
  const now = new Date(Date.now() - 60 * 60 * 1000); // 1 hour earlier
  const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  const baseTime = `${String(now.getHours()).padStart(2, '0')}00`;
  return { baseDate, baseTime };
}

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
// Return latest hourly temperature. If ?city is provided, return history for that city.
exports.getCityTempHistory = asyncHandler(async (req, res) => {
  const { city } = req.query;
  const db = req.app.locals.db;

  if (!city || city === 'all') {
    const cutoff = `${new Date(Date.now() - 60 * 60 * 1000)
      .toISOString()
      .slice(0, 13)}:00`;
    const pipeline = [
      { $match: { time: { $gte: cutoff } } },
      { $sort: { time: -1 } },
      {
        $group: {
          _id: '$city',
          time: { $first: '$time' },
          temperature: { $first: '$temperature' },
        },
      },
      { $project: { _id: 0, city: '$_id', time: 1, temperature: 1 } },
      { $sort: { city: 1 } },
    ];
    const data = await db
      .collection('cityWeather')
      .aggregate(pipeline)
      .toArray();
    return res.json(data);
  }

  const pipeline = [
    { $match: { city: city.toLowerCase() } },
    { $project: { _id: 0, time: 1, temperature: 1 } },
    { $sort: { time: 1 } },
  ];
  const data = await db.collection('cityWeather').aggregate(pipeline).toArray();
  return res.json(data);
});

// POST /api/dashboard/city-temp
// Fetch latest temperature from KMA and store in DB
exports.saveCityTemp = asyncHandler(async (req, res) => {
  const city = (req.body.city || req.query.city || 'seoul').toLowerCase();

  const coords = cityCoords[city];
  if (!coords) return res.status(400).json({ message: 'Unknown city' });

  const { baseDate, baseTime } = getDefaultBaseDateTime();
  const { temperature } = await fetchDaily(baseDate, baseTime, coords.nx, coords.ny);

  const isoTime = `${baseDate.slice(0, 4)}-${baseDate.slice(4, 6)}-${baseDate.slice(6, 8)}T${baseTime.slice(0, 2)}:00`;

  const db = req.app.locals.db;
  await db.collection('cityWeather').updateOne(
    { city, time: isoTime },
    { $set: { temperature, updatedAt: new Date() } },
    { upsert: true },
  );

  res.json({ city, time: isoTime, temperature });
});

// GET /api/dashboard/sales-ad-summary
// Return daily sum of sales and ad cost
exports.getDailySalesAdSummary = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;

  const sales = await db
    .collection('coupangSales')
    .aggregate([
      {
        $group: {
          _id: '$startDate',
          totalSales: {
            $sum: {
              $toDouble: {
                $replaceAll: { input: '$payoutAmount', find: ',', replacement: '' },
              },
            },
          },
        },
      },
      { $project: { _id: 0, date: '$_id', totalSales: 1 } },
    ])
    .toArray();

  const ads = await db
    .collection('adHistory')
    .aggregate([
      { $group: { _id: '$date', totalAdCost: { $sum: { $toDouble: '$cost' } } } },
      { $project: { _id: 0, date: '$_id', totalAdCost: 1 } },
    ])
    .toArray();

  const map = {};
  sales.forEach((s) => {
    map[s.date] = { date: s.date, sales: s.totalSales, adCost: 0 };
  });
  ads.forEach((a) => {
    if (map[a.date]) map[a.date].adCost = a.totalAdCost;
    else map[a.date] = { date: a.date, sales: 0, adCost: a.totalAdCost };
  });

  const data = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  res.json(data);
});

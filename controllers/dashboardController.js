const asyncHandler = require('../middlewares/asyncHandler');
const { fetchDaily } = require('./weatherController');

function getDefaultBaseDateTime() {
  const now = new Date();
  let baseDateObj = new Date(now);
  let hour = now.getHours();
  if (now.getMinutes() < 40) {
    hour -= 1;
    if (hour < 0) {
      hour = 23;
      baseDateObj = new Date(now.getTime() - 86400000);
    }
  }
  const baseDate = baseDateObj.toISOString().slice(0, 10).replace(/-/g, '');
  const baseTime = `${String(hour).padStart(2, '0')}00`;
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
// Return hourly temperature for a given city from DB
exports.getCityTempHistory = asyncHandler(async (req, res) => {
  const city = (req.query.city || 'seoul').toLowerCase();

  const pipeline = [
    { $match: { city } },
    { $project: { _id: 0, time: 1, temperature: 1 } },
    { $sort: { time: 1 } },
  ];

  const db = req.app.locals.db;
  const data = await db.collection('cityWeather').aggregate(pipeline).toArray();
  res.json(data);
});

// POST /api/dashboard/city-temp
// Fetch latest temperature from KMA and store in DB
exports.saveCityTemp = asyncHandler(async (req, res) => {
  const city = (req.body.city || req.query.city || 'seoul').toLowerCase();

  const coordsMap = {
    seoul: { nx: '60', ny: '127' },
    busan: { nx: '98', ny: '76' },
    daegu: { nx: '89', ny: '90' },
    incheon: { nx: '55', ny: '124' },
    gwangju: { nx: '58', ny: '74' },
    daejeon: { nx: '67', ny: '100' },
  };
  const coords = coordsMap[city];
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

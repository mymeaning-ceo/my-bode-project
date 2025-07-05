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
// Return hourly temperature for a given city (past 24 hours)
exports.getCityTempHistory = asyncHandler(async (req, res) => {
  const city = (req.query.city || 'seoul').toLowerCase();
  const cityCoords = {
    seoul: { lat: 37.5665, lon: 126.978 },
    busan: { lat: 35.1796, lon: 129.0756 },
    daegu: { lat: 35.8722, lon: 128.6025 },
    incheon: { lat: 37.4563, lon: 126.7052 },
    gwangju: { lat: 35.1595, lon: 126.8526 },
    daejeon: { lat: 36.3504, lon: 127.3845 },
  };
  const coords = cityCoords[city];
  if (!coords) {
    return res.status(400).json({ message: 'Unknown city' });
  }
  const params = new URLSearchParams({
    latitude: coords.lat,
    longitude: coords.lon,
    hourly: 'temperature_2m',
    timezone: 'Asia/Seoul',
    past_days: '1',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) {
    return res.status(502).json({ message: 'Weather API error' });
  }
  const data = await response.json();
  const times = data.hourly.time || [];
  const temps = data.hourly.temperature_2m || [];
  const result = times.map((t, idx) => ({ time: t, temperature: temps[idx] }));
  res.json(result);
});

const fetch = require('node-fetch');
const asyncHandler = require('../middlewares/asyncHandler');

const cityCoords = {
  seoul: { lat: 37.5665, lon: 126.978 },
  busan: { lat: 35.1796, lon: 129.0756 },
  daegu: { lat: 35.8722, lon: 128.6025 },
  incheon: { lat: 37.4563, lon: 126.7052 },
  gwangju: { lat: 35.1595, lon: 126.8526 },
  daejeon: { lat: 36.3504, lon: 127.3845 },
};

async function fetchCityTemp(coords, targetDate = new Date(Date.now() - 60 * 60 * 1000)) {
  const params = new URLSearchParams({
    latitude: coords.lat,
    longitude: coords.lon,
    hourly: 'temperature_2m',
    timezone: 'Asia/Seoul',
    past_days: '1',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) {
    throw new Error('Weather API error');
  }
  const data = await response.json();
  const target = `${targetDate.toISOString().slice(0, 13)}:00`;
  const idx = data.hourly.time.indexOf(target);
  if (idx === -1) {
    throw new Error('No data for target time');
  }
  return { time: data.hourly.time[idx], temperature: data.hourly.temperature_2m[idx] };
}

exports.fetchCityTemp = fetchCityTemp;

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
  const coords = cityCoords[city];
  if (!coords) {
    return res.status(400).json({ message: 'Unknown city' });
  }

  const db = req.app.locals.db;
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const latest = await db
    .collection('cityWeather')
    .find({ city })
    .sort({ time: -1 })
    .limit(1)
    .next();

  if (!latest || new Date(latest.time) < oneHourAgo) {
    try {
      const { time, temperature } = await fetchCityTemp(coords, oneHourAgo);
      await db.collection('cityWeather').updateOne(
        { city, time },
        { $set: { temperature, updatedAt: new Date() } },
        { upsert: true },
      );
    } catch (err) {
      console.error('❌ City weather fetch failed:', err.message);
    }
  }

  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const docs = await db
    .collection('cityWeather')
    .find({ city, time: { $gte: cutoff.toISOString() } })
    .sort({ time: 1 })
    .toArray();

  const result = docs.map((d) => ({ time: d.time, temperature: d.temperature }));
  res.json(result);
});

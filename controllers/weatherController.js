let fetchFunc;
try {
  // Prefer the global fetch available in modern Node versions
  fetchFunc = global.fetch ? global.fetch : require('node-fetch');
} catch (err) {
  fetchFunc = require('node-fetch');
}
const asyncHandler = require('../middlewares/asyncHandler');

// Fetch daily weather from KMA API
exports.getDailyWeather = asyncHandler(async (req, res) => {
  const baseDate = req.query.date || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const baseTime = req.query.time || '1200';
  const nx = req.query.nx || '60';
  const ny = req.query.ny || '127';
  const serviceKey = encodeURIComponent(process.env.WEATHER_API_KEY || '');

  const params = new URLSearchParams({
    serviceKey,
    pageNo: '1',
    numOfRows: '1000',
    dataType: 'JSON',
    base_date: baseDate,
    base_time: baseTime,
    nx,
    ny,
  });

  const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?${params}`;

  const response = await fetchFunc(url);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    const text = await response.text();
    throw new Error(`Invalid JSON: ${text.slice(0, 100)}`);
  }

  const items = data?.response?.body?.items?.item || [];
  const findVal = (cat) => items.find((i) => i.category === cat)?.fcstValue;

  res.json({
    temperature: findVal('T1H'),
    sky: findVal('SKY'),
    precipitationType: findVal('PTY'),
  });
});

// Summary of last 90 days from MongoDB
exports.getWeatherSummary = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const coll = db.collection('weather');
  const today = new Date();
  today.setDate(today.getDate() - 90);
  const startKey = today.toISOString().slice(0, 10).replace(/-/g, '');

  const docs = await coll
    .find({ _id: { $gte: startKey } })
    .project({ TMX: 1, TMN: 1, POP: 1 })
    .toArray();

  if (!docs.length) {
    return res.status(404).json({ message: 'No data' });
  }

  let sumMax = 0;
  let sumMin = 0;
  let sumPop = 0;
  let count = 0;

  for (const d of docs) {
    const max = parseFloat(d.TMX);
    const min = parseFloat(d.TMN);
    const pop = parseFloat(d.POP);
    if (!Number.isNaN(max)) sumMax += max;
    if (!Number.isNaN(min)) sumMin += min;
    if (!Number.isNaN(pop)) sumPop += pop;
    count += 1;
  }

  res.json({
    averageMax: (sumMax / count).toFixed(1),
    averageMin: (sumMin / count).toFixed(1),
    averagePop: (sumPop / count).toFixed(1),
    days: count,
  });
});

// Get stored weather by date
exports.getWeatherByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  if (!date) {
    return res.status(400).json({ message: 'date required' });
  }
  const key = date.replace(/-/g, '');
  const coll = req.app.locals.db.collection('weather');
  const doc = await coll.findOne({ _id: key });
  if (!doc) return res.status(404).json({ message: 'No data' });
  res.json(doc);
});

// Get range of stored weather data
exports.getWeatherRange = asyncHandler(async (req, res) => {
  const { date, period } = req.query;
  if (!date) return res.status(400).json({ message: 'date required' });
  const monthsMap = { '3m': 3, '6m': 6, '1y': 12 };
  const months = monthsMap[period] || 3;
  const end = new Date(date);
  const start = new Date(date);
  start.setMonth(start.getMonth() - months);
  const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
  const coll = req.app.locals.db.collection('weather');
  const docs = await coll
    .find({ _id: { $gte: fmt(start), $lte: fmt(end) } })
    .sort({ _id: 1 })
    .toArray();
  res.json(docs);
});

// Fetch weather data for the same day across past years
exports.getSameDay = asyncHandler(async (req, res) => {
  const { date, years = 1 } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'date query required' });
  }

  const normalized = date.replace(/-/g, '');
  const baseYear = parseInt(normalized.slice(0, 4), 10);
  const mmdd = normalized.slice(4);

  const ids = [];
  for (let i = 0; i < Number(years); i += 1) {
    ids.push(`${baseYear - i}${mmdd}`);
  }

  const docs = await req.app.locals.db
    .collection('weather')
    .find({ _id: { $in: ids } })
    .project({ _id: 1 })
    .sort({ _id: -1 })
    .toArray();

  res.json(docs);
});

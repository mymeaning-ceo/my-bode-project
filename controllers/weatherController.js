const fetch = require('node-fetch');
const asyncHandler = require('../middlewares/asyncHandler');

// Common helper to fetch weather data for a single day
async function fetchDaily(date, time = '1200', nx = '60', ny = '127') {
  const serviceKey = encodeURIComponent(process.env.WEATHER_API_KEY || '');

  const params = new URLSearchParams({
    serviceKey,
    pageNo: '1',
    numOfRows: '1000',
    dataType: 'JSON',
    base_date: date,
    base_time: time,
    nx,
    ny,
  });

  const url =
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?${params}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  const items = data?.response?.body?.items?.item || [];
  const findVal = (cat) => items.find((i) => i.category === cat)?.fcstValue;

  return {
    temperature: findVal('T1H'),
    sky: findVal('SKY'),
    precipitationType: findVal('PTY'),
  };
}

// Fetch daily weather from KMA API
const getDailyWeather = asyncHandler(async (req, res) => {
  const baseDate =
    req.query.date || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const baseTime = req.query.time || '1200';
  const nx = req.query.nx || '60';
  const ny = req.query.ny || '127';

  const data = await fetchDaily(baseDate, baseTime, nx, ny);
  res.json(data);
});

// Fetch weather data for the same day across past years
const getSameDay = asyncHandler(async (req, res) => {
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

  // Ensure deterministic order
  docs.sort((a, b) => b._id.localeCompare(a._id));

  res.json(docs);
});

// Fetch daily weather for an entire month
const getMonthlyWeather = asyncHandler(async (req, res) => {
  const year = req.query.year || new Date().getFullYear().toString();
  const month = (req.query.month || new Date().getMonth() + 1)
    .toString()
    .padStart(2, '0');

  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
  const result = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}${month}${String(day).padStart(2, '0')}`;
    try {
      const data = await fetchDaily(date);
      result.push({ date: `${year}-${month}-${String(day).padStart(2, '0')}`, ...data });
    } catch (err) {
      // Skip failed days but record error
      result.push({ date: `${year}-${month}-${String(day).padStart(2, '0')}`, error: err.message });
    }
  }

  res.json(result);
});

module.exports = {
  getDailyWeather,
  getSameDay,
  getMonthlyWeather,
};

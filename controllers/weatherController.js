const fetch = require('node-fetch');
const asyncHandler = require('../middlewares/asyncHandler');

// Common helper to fetch weather data for a single day
async function fetchDaily(date, time = '1200', nx = '60', ny = '127') {
  if (!process.env.WEATHER_API_KEY) {
    throw new Error('WEATHER_API_KEY not configured');
  }

  const serviceKey = process.env.WEATHER_API_KEY;

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
  const now = new Date(Date.now() - 30 * 60 * 1000);
  const defaultDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = now.getMinutes() < 30 ? '00' : '30';
  const defaultTime = `${hour}${minute}`;

  const baseDate = req.query.date || defaultDate;
  const baseTime = req.query.time || defaultTime;
  const nx = req.query.nx || '60';
  const ny = req.query.ny || '127';

  let data;
  try {
    data = await fetchDaily(baseDate, baseTime, nx, ny);
  } catch (err) {
    console.error('❌ fetchDaily failed:', err.message);
    // Try to return cached data from MongoDB
    const cached = await req.app.locals.db
      .collection('weather')
      .findOne({ _id: baseDate });
    if (cached) {
      return res.json({
        temperature: cached.temperature,
        sky: cached.sky,
        precipitationType: cached.precipitationType,
        cached: true,
      });
    }
    throw err;
  }

  try {
    const db = req.app.locals.db;
    await db.collection('weather').updateOne(
      { _id: baseDate },
      { $set: { ...data, updatedAt: new Date() } },
      { upsert: true },
    );
  } catch (err) {
    console.error('❌ Weather DB update failed:', err.message);
  }

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

  const now = new Date();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}${month}${String(day).padStart(2, '0')}`;

    let doc = await req.app.locals.db.collection('weather').findOne({ _id: date });
    if (!doc) {
      const target = new Date(`${year}-${month}-${String(day).padStart(2, '0')}`);
      const diffDays = (now - target) / (1000 * 60 * 60 * 24);
      if (diffDays <= 3) {
        try {
          doc = await fetchDaily(date);
          await req.app.locals.db.collection('weather').updateOne(
            { _id: date },
            { $set: { ...doc, updatedAt: new Date() } },
            { upsert: true },
          );
        } catch (err) {
          result.push({ date: `${year}-${month}-${String(day).padStart(2, '0')}`, error: err.message });
          continue;
        }
      }
    }

    if (doc) {
      result.push({ date: `${year}-${month}-${String(day).padStart(2, '0')}`, ...doc });
    } else {
      result.push({ date: `${year}-${month}-${String(day).padStart(2, '0')}`, error: 'no data' });
    }
  }

  res.json(result);
});

// Calculate average temperature for a specific day
const getAverageTemperature = asyncHandler(async (req, res) => {
  const { year, month, day } = req.query;

  if (!year || !month || !day) {
    return res
      .status(400)
      .json({ message: 'year, month and day query required' });
  }

  const paddedMonth = month.toString().padStart(2, '0');
  const paddedDay = day.toString().padStart(2, '0');
  const date = `${year}${paddedMonth}${paddedDay}`;
  const times = ['0000', '0600', '1200', '1800'];
  let sum = 0;
  let count = 0;

  for (const time of times) {
    try {
      const { temperature } = await fetchDaily(date, time);
      if (temperature !== undefined) {
        sum += Number(temperature);
        count += 1;
      }
    } catch (err) {
      // Ignore individual fetch errors
    }
  }

  if (count === 0) {
    return res.status(500).json({ message: 'Failed to fetch weather data' });
  }

  res.json({
    date: `${year}-${paddedMonth}-${paddedDay}`,
    averageTemperature: Number(sum / count).toFixed(1),
  });
});

const xlsx = require('xlsx');
const fs = require('fs');

const uploadMonthlyExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'no file' });
  }
  const workbook = xlsx.readFile(req.file.path, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const ops = rows.map((row) => {
    const date =
      typeof row.date === 'string'
        ? row.date.replace(/-/g, '')
        : row.date instanceof Date
          ? row.date.toISOString().slice(0, 10).replace(/-/g, '')
          : String(row.date || '').replace(/-/g, '');
    return {
      updateOne: {
        filter: { _id: date },
        update: {
          $set: {
            temperature: row.temperature,
            sky: row.sky,
            precipitationType: row.precipitationType,
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    };
  });

  if (ops.length) {
    await req.app.locals.db.collection('weather').bulkWrite(ops);
  }

  fs.unlink(req.file.path, () => {});
  res.json({ inserted: ops.length });
});

const getHistory = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ message: 'from and to required' });
  }
  const start = from.replace(/-/g, '');
  const end = to.replace(/-/g, '');
  const docs = await req.app.locals.db
    .collection('weather')
    .find({ _id: { $gte: start, $lte: end } })
    .sort({ _id: 1 })
    .toArray();
  res.json(docs);
});

module.exports = {
  fetchDaily,
  getDailyWeather,
  getSameDay,
  getMonthlyWeather,
  getAverageTemperature,
  uploadMonthlyExcel,
  getHistory,
};

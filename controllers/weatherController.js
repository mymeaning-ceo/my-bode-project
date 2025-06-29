const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const xlsx = require('xlsx');
const asyncHandler = require('../middlewares/asyncHandler');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `excel_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage }).single('excelFile');

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
  const now = new Date();
  now.setMinutes(now.getMinutes() - 30);
  const baseDate =
    req.query.date || now.toISOString().slice(0, 10).replace(/-/g, '');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = now.getMinutes() >= 30 ? '30' : '00';
  const baseTime = req.query.time || `${hh}${mm}`;
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

// Fetch daily weather for an entire month from DB
const getMonthlyWeather = asyncHandler(async (req, res) => {
  const year = req.query.year || new Date().getFullYear().toString();
  const month = (req.query.month || new Date().getMonth() + 1)
    .toString()
    .padStart(2, '0');

  const regex = new RegExp(`^${year}${month}`);
  const docs = await req.app.locals.db
    .collection('monthlyWeather')
    .find({ _id: { $regex: regex } })
    .sort({ _id: 1 })
    .toArray();

  const result = docs.map((d) => ({
    date: d.date || `${d._id.slice(0, 4)}-${d._id.slice(4, 6)}-${d._id.slice(6, 8)}`,
    temperature: d.temperature,
    sky: d.sky,
    precipitationType: d.precipitationType,
  }));

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

// Upload monthly weather Excel and save to DB
const uploadMonthlyExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '파일이 없습니다.' });
  }
  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const docs = [];

  for (const row of rows) {
    const rawDate = row.date || row.날짜 || row.Date;
    if (!rawDate) continue;
    const d = new Date(rawDate);
    if (Number.isNaN(d)) continue;
    const id = d.toISOString().slice(0, 10).replace(/-/g, '');
    docs.push({
      _id: id,
      date: d.toISOString().slice(0, 10),
      temperature: row.temperature ?? row.temp ?? row.기온,
      sky: row.sky ?? row.하늘상태,
      precipitationType: row.precipitationType ?? row.강수형태,
      updatedAt: new Date(),
    });
  }

  const col = req.app.locals.db.collection('monthlyWeather');
  for (const doc of docs) {
    await col.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
  }
  fs.unlink(filePath, () => {});
  res.json({ status: 'success', inserted: docs.length });
});

module.exports = {
  fetchDaily,
  getDailyWeather,
  getSameDay,
  getMonthlyWeather,
  getAverageTemperature,
  upload,
  uploadMonthlyExcel,
};

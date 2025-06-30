const fetch = require("node-fetch");
const multerImport = require("multer");
const multer = multerImport.default || multerImport;
const fs = require("fs");
const xlsx = require("xlsx");
const asyncHandler = require("../middlewares/asyncHandler");

// Common helper to fetch weather data for a single day
// Default coordinates point to Cheonan, Chungcheongnam-do
async function fetchDaily(
  date,
  time = "1200",
  nx = process.env.WEATHER_NX || "67",
  ny = process.env.WEATHER_NY || "110",
) {
  if (!process.env.WEATHER_API_KEY) {
    throw new Error("WEATHER_API_KEY not configured");
  }

  const serviceKey = process.env.WEATHER_API_KEY;

  const params = new URLSearchParams({
    serviceKey,
    pageNo: "1",
    numOfRows: "1000",
    dataType: "JSON",
    base_date: date,
    base_time: time,
    nx,
    ny,
  });

  const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?${params}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  const items = data?.response?.body?.items?.item || [];
  const findVal = (cat) => items.find((i) => i.category === cat)?.fcstValue;

  return {
    temperature: findVal("T1H"),
    sky: findVal("SKY"),
    precipitationType: findVal("PTY"),
  };
}

// Fetch daily weather from KMA API
const getDailyWeather = asyncHandler(async (req, res) => {
  const baseDate =
    req.query.date || new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const baseTime = req.query.time || "1200";
  const nx = req.query.nx || "60";
  const ny = req.query.ny || "127";

  let data;
  try {
    data = await fetchDaily(baseDate, baseTime, nx, ny);
  } catch (err) {
    console.error("❌ fetchDaily failed:", err.message);
    // Try to return cached data from MongoDB
    const cached = await req.app.locals.db
      .collection("weather")
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
    await db
      .collection("weather")
      .updateOne(
        { _id: baseDate },
        { $set: { ...data, updatedAt: new Date() } },
        { upsert: true },
      );
  } catch (err) {
    console.error("❌ Weather DB update failed:", err.message);
  }

  res.json(data);
});

// Fetch weather data for the same day across past years
const getSameDay = asyncHandler(async (req, res) => {
  const { date, years = 1 } = req.query;

  if (!date) {
    return res.status(400).json({ message: "date query required" });
  }

  const normalized = date.replace(/-/g, "");
  const baseYear = parseInt(normalized.slice(0, 4), 10);
  const mmdd = normalized.slice(4);

  const ids = [];
  for (let i = 0; i < Number(years); i += 1) {
    ids.push(`${baseYear - i}${mmdd}`);
  }

  const docs = await req.app.locals.db
    .collection("weather")
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
    .padStart(2, "0");

  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
  const result = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}${month}${String(day).padStart(2, "0")}`;
    try {
      const data = await fetchDaily(date);
      result.push({
        date: `${year}-${month}-${String(day).padStart(2, "0")}`,
        ...data,
      });
    } catch (err) {
      // Skip failed days but record error
      result.push({
        date: `${year}-${month}-${String(day).padStart(2, "0")}`,
        error: err.message,
      });
    }
  }

  res.json(result);
});

// Fetch monthly weather from DB
const getMonthlyWeatherFromDb = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) {
    return res.status(400).json({ message: "year and month query required" });
  }
  const prefix = `${year}${String(month).padStart(2, "0")}`;
  const docs = await req.app.locals.db
    .collection("weather")
    .find({ _id: { $regex: `^${prefix}` } })
    .sort({ _id: 1 })
    .toArray();
  res.json(docs);
});

// Calculate average temperature for a specific day
const getAverageTemperature = asyncHandler(async (req, res) => {
  const { year, month, day } = req.query;

  if (!year || !month || !day) {
    return res
      .status(400)
      .json({ message: "year, month and day query required" });
  }

  const paddedMonth = month.toString().padStart(2, "0");
  const paddedDay = day.toString().padStart(2, "0");
  const date = `${year}${paddedMonth}${paddedDay}`;
  const times = ["0000", "0600", "1200", "1800"];
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
    return res.status(500).json({ message: "Failed to fetch weather data" });
  }

  res.json({
    date: `${year}-${paddedMonth}-${paddedDay}`,
    averageTemperature: Number(sum / count).toFixed(1),
  });
});

// Stub upload middleware and API to keep old routes working
const upload = multer({ dest: "uploads/" }).single("excelFile");

const uploadExcelApi = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ status: "error", message: "파일이 없습니다." });
  }
  try {
    const wb = xlsx.readFile(req.file.path, { cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
    const docs = rows
      .map((r) => {
        const d = r.date || r.날짜 || r.DATE;
        const date = new Date(d);
        if (Number.isNaN(date.getTime())) return null;
        const id = date.toISOString().slice(0, 10).replace(/-/g, "");
        return {
          _id: id,
          date: date.toISOString().slice(0, 10),
          temperature:
            r.temperature ?? r.평균기온 ?? r.temp ?? r.TEMP ?? null,
          sky: r.sky ?? r.하늘상태 ?? null,
          precipitationType: r.precipitationType ?? r.강수형태 ?? null,
          updatedAt: new Date(),
        };
      })
      .filter(Boolean);

    const col = req.app.locals.db.collection("weather");
    const ops = docs.map((doc) => ({
      updateOne: { filter: { _id: doc._id }, update: { $set: doc }, upsert: true },
    }));
    if (ops.length) await col.bulkWrite(ops);
    res.json({ status: "success", inserted: ops.length });
  } catch (err) {
    console.error("❌ Excel upload error:", err);
    res.status(500).json({ status: "error", message: "Upload failed" });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

const getHistory = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const history = await db
    .collection("weather")
    .find()
    .sort({ _id: -1 })
    .limit(50)
    .toArray();
  res.json(history);
});

const createRecord = asyncHandler(async (req, res) => {
  const { _id, temperature } = req.body;
  if (!_id || temperature === undefined) {
    return res.status(400).json({ message: "_id and temperature required" });
  }
  await req.app.locals.db
    .collection("weather")
    .insertOne({ _id, temperature });
  res.status(201).json({ insertedId: _id });
});

const getRecord = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const doc = await req.app.locals.db
    .collection("weather")
    .findOne({ _id: id });
  if (!doc) return res.status(404).json({ message: "not found" });
  res.json({ _id: doc._id, temperature: doc.temperature });
});

const updateRecord = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { temperature } = req.body;
  const result = await req.app.locals.db
    .collection("weather")
    .findOneAndUpdate(
      { _id: id },
      { $set: { temperature } },
      { returnDocument: "after" }
    );
  if (!result.value) return res.status(404).json(null);
  res.json({ _id: result.value._id, temperature: result.value.temperature });
});

const deleteRecord = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const result = await req.app.locals.db
    .collection("weather")
    .deleteOne({ _id: id });
  if (result.deletedCount === 0) return res.status(404).json(null);
  res.json({ deleted: id });
});

module.exports = {
  fetchDaily,
  getDailyWeather,
  getSameDay,
  getMonthlyWeather,
  getMonthlyWeatherFromDb,
  getAverageTemperature,
  upload,
  uploadExcelApi,
  getHistory,
  createRecord,
  getRecord,
  updateRecord,
  deleteRecord,
};

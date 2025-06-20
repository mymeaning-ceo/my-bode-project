const fetch = require('node-fetch');
const asyncHandler = require('../middlewares/asyncHandler');

// Fetch daily weather from KMA API
exports.getDailyWeather = asyncHandler(async (req, res) => {
  const baseDate =
    req.query.date || new Date().toISOString().slice(0, 10).replace(/-/g, '');
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

  const response = await fetch(url);
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

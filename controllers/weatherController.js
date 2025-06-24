const fetch = require('node-fetch');
const asyncHandler = require('../middlewares/asyncHandler');
const { spawn } = require('child_process');
const path = require('path');

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

// Fetch historical weather using Meteostat via Python
exports.getMeteostatWeather = asyncHandler(async (req, res) => {
  const lat = req.query.lat || '37.5665';
  const lon = req.query.lon || '126.9780';
  const start = req.query.start || '2024-01-01';
  const end = req.query.end || '2024-03-31';
  const scriptPath = path.join(__dirname, '../scripts/meteostat_weather.py');

  const py = spawn('python', ['-u', scriptPath, lat, lon, start, end], {
    shell: true,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });

  let output = '';
  py.stdout.on('data', (d) => {
    output += d.toString();
  });
  py.stderr.on('data', (d) => {
    console.error(`\u26A0\uFE0F Python STDERR: ${d.toString()}`);
  });

  const timeout = setTimeout(() => {
    if (!py.killed) {
      py.kill('SIGTERM');
      console.error('\u23F1\uFE0F Python execution timeout');
      if (!res.headersSent) res.status(500).json({ error: 'Python timeout' });
    }
  }, 30000);

  py.on('close', (code) => {
    clearTimeout(timeout);
    if (res.headersSent) return;
    if (code === 0) {
      try {
        const data = JSON.parse(output || '[]');
        res.json(data);
      } catch (err) {
        console.error('Invalid JSON from Python');
        res.status(500).json({ error: 'Invalid JSON from Python' });
      }
    } else {
      res.status(500).json({ error: 'Python process failed' });
    }
  });
});

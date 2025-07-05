const { coupangRequest } = require('../lib/coupangApiClient');
const { fetchDaily } = require('../controllers/weatherController');

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

async function updateInventory(db) {
  const ids = await db.collection('coupang').distinct('Option ID');
  for (const id of ids) {
    try {
      const path = `/v2/providers/openapi/apis/api/v1/marketplace/vendor-items/${id}`;
      const data = await coupangRequest('GET', path);
      const item = {
        optionId: id,
        optionName: data?.data?.optionName || '',
        productName: data?.data?.sellerProductName || '',
        price: data?.data?.price || 0,
        stock: data?.data?.approvedStock || 0,
        updatedAt: new Date(),
      };
      await db.collection('productStock').updateOne({ optionId: id }, { $set: item }, { upsert: true });
    } catch (err) {
      console.error('❌ Inventory fetch failed:', id, err.message);
    }
  }
}

async function calcAdMetrics(db) {
  const pipeline = [
    {
      $group: {
        _id: '$광고집행 옵션ID',
        impressions: { $sum: '$노출수' },
        clicks: { $sum: '$클릭수' },
        adCost: { $sum: '$광고비' },
      },
    },
    {
      $project: {
        _id: 0,
        optionId: '$_id',
        impressions: 1,
        clicks: 1,
        adCost: 1,
        ctr: {
          $cond: [
            { $gt: ['$impressions', 0] },
            {
              $round: [
                { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] },
                2,
              ],
            },
            0,
          ],
        },
        cpc: {
          $cond: [{ $gt: ['$clicks', 0] }, { $round: [{ $divide: ['$adCost', '$clicks'] }, 2] }, 0],
        },
      },
    },
  ];
  const data = await db.collection('coupangAdd').aggregate(pipeline).toArray();
  for (const row of data) {
    await db.collection('adMetrics').updateOne(
      { optionId: row.optionId },
      { $set: { ...row, updatedAt: new Date() } },
      { upsert: true },
    );
  }
}

async function saveTodayWeather(db) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  try {
    const data = await fetchDaily(date);
    await db.collection('weather').updateOne(
      { _id: date },
      { $set: { ...data, updatedAt: new Date() } },
      { upsert: true },
    );
  } catch (err) {
    console.error('❌ Weather fetch failed:', err.message);
  }
}

async function saveCityTemperatures(db) {
  const cities = {
    seoul: { nx: '60', ny: '127' },
    busan: { nx: '98', ny: '76' },
    daegu: { nx: '89', ny: '90' },
    incheon: { nx: '55', ny: '124' },
    gwangju: { nx: '58', ny: '74' },
    daejeon: { nx: '67', ny: '100' },
  };

  const { baseDate, baseTime } = getDefaultBaseDateTime();
  const isoTime = `${baseDate.slice(0, 4)}-${baseDate.slice(4, 6)}-${baseDate.slice(6, 8)}T${baseTime.slice(0, 2)}:00`;

  for (const [city, coords] of Object.entries(cities)) {
    try {
      const { temperature } = await fetchDaily(baseDate, baseTime, coords.nx, coords.ny);
      await db.collection('cityWeather').updateOne(
        { city, time: isoTime },
        { $set: { temperature, updatedAt: new Date() } },
        { upsert: true },
      );
    } catch (err) {
      console.error('❌ City weather fetch failed:', city, err.message);
    }
  }
}

async function saveDailyAdCost(db) {
  const rows = await db
    .collection('coupangAdd')
    .aggregate([
      {
        $group: {
          _id: '$날짜',
          cost: { $sum: '$광고비' },
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $cond: [
              { $eq: [{ $type: '$_id' }, 'date'] },
              { $dateToString: { format: '%Y%m%d', date: '$_id' } },
              '$_id',
            ],
          },
          cost: 1,
        },
      },
    ])
    .toArray();

  for (const row of rows) {
    await db.collection('adHistory').updateOne(
      { date: row.date },
      { $set: { cost: row.cost, updatedAt: new Date() } },
      { upsert: true },
    );
  }
}

function startCronJobs(db) {
  // Update inventory every hour
  setInterval(() => updateInventory(db), 60 * 60 * 1000);

  // Save city temperatures every hour
  saveCityTemperatures(db);
  setInterval(() => saveCityTemperatures(db), 60 * 60 * 1000);

  // Save today's weather at 00:10
  const nowWeather = new Date();
  const firstWeather = new Date(nowWeather);
  firstWeather.setHours(0, 10, 0, 0);
  if (firstWeather <= nowWeather) firstWeather.setDate(firstWeather.getDate() + 1);

  setTimeout(() => {
    saveTodayWeather(db);
    setInterval(() => saveTodayWeather(db), 24 * 60 * 60 * 1000);
  }, firstWeather - nowWeather);

  // Calculate ad metrics daily at 00:30
  const now = new Date();
  const firstRun = new Date(now);
  firstRun.setHours(0, 30, 0, 0);
  if (firstRun <= now) firstRun.setDate(firstRun.getDate() + 1);

  setTimeout(() => {
    calcAdMetrics(db);
    setInterval(() => calcAdMetrics(db), 24 * 60 * 60 * 1000);
  }, firstRun - now);

  // Save daily ad cost at 00:40
  const costRun = new Date(now);
  costRun.setHours(0, 40, 0, 0);
  if (costRun <= now) costRun.setDate(costRun.getDate() + 1);

  setTimeout(() => {
    saveDailyAdCost(db);
    setInterval(() => saveDailyAdCost(db), 24 * 60 * 60 * 1000);
  }, costRun - now);
}

module.exports = { startCronJobs, saveDailyAdCost };

const { coupangRequest } = require('../lib/coupangApiClient');

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

function startCronJobs(db) {
  // Update inventory every hour
  setInterval(() => updateInventory(db), 60 * 60 * 1000);

  // Calculate ad metrics daily at 00:30
  const now = new Date();
  const firstRun = new Date(now);
  firstRun.setHours(0, 30, 0, 0);
  if (firstRun <= now) firstRun.setDate(firstRun.getDate() + 1);

  setTimeout(() => {
    calcAdMetrics(db);
    setInterval(() => calcAdMetrics(db), 24 * 60 * 60 * 1000);
  }, firstRun - now);
}

module.exports = { startCronJobs };

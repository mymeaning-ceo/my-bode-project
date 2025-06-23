const cron = require('node-cron');
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
  cron.schedule('0 * * * *', () => updateInventory(db));
  cron.schedule('30 0 * * *', () => calcAdMetrics(db));
}

module.exports = { startCronJobs };

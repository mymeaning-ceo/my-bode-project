const { coupangRequest } = require('../lib/coupangApiClient');
const asyncHandler = require('../middlewares/asyncHandler');

exports.fetchPayouts = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const { start, end, page = 0, size = 20 } = req.query;
  const query = { page: Number(page), size: Number(size) };
  if (start) query.startDate = start;
  if (end) query.endDate = end;

  const data = await coupangRequest(
    'GET',
    '/v2/providers/seller_api/apis/api/v1/settlement/payouts',
    { query }
  );

  const list = Array.isArray(data.content) ? data.content : [];
  if (list.length) {
    const bulk = list.map((item) => ({
      updateOne: {
        filter: { settlementId: item.settlementId },
        update: { $set: item },
        upsert: true,
      },
    }));
    await db.collection('coupangSales').bulkWrite(bulk);
  }

  res.json(list);
});

exports.getAll = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const rows = await db
    .collection('coupangSales')
    .find()
    .sort({ settlementId: -1 })
    .toArray();
  res.json(rows);
});

// DataTables API
exports.getStockData = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const page   = parseInt(req.query.page, 10)  || 1;
  const limit  = parseInt(req.query.limit, 10) || 50;
  const skip   = (page - 1) * limit;
  const draw   = parseInt(req.query.draw, 10)  || 1;
  const keyword = req.query.keyword || '';

  const query = keyword
    ? {
        $or: [
          { item_name: { $regex: keyword, $options: 'i' } },
          { item_code: { $regex: keyword, $options: 'i' } }
        ]
      }
    : {};

  const [rows, total] = await Promise.all([
    db.collection('stock')
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection('stock').countDocuments(query)
  ]);

  res.json({
    draw,
    recordsTotal: total,
    recordsFiltered: total,
    data: rows
  });
});
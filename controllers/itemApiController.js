const { ObjectId } = require('mongodb');
const asyncHandler = require('../middlewares/asyncHandler');

// Get all items
exports.list = asyncHandler(async (req, res) => {
  const items = await req.app.locals.db.collection('items').find().toArray();
  res.json(items);
});

// Create new item
exports.create = asyncHandler(async (req, res) => {
  const { name, price } = req.body;
  const item = { name, price: Number(price), createdAt: new Date() };
  const result = await req.app.locals.db.collection('items').insertOne(item);
  item._id = result.insertedId;
  res.json(item);
});

// Update existing item
exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;
  const result = await req.app.locals.db.collection('items').updateOne(
    { _id: new ObjectId(id) },
    { $set: { name, price: Number(price) } },
  );
  if (result.matchedCount === 0) return res.status(404).json({ message: 'Item not found' });
  res.json({ success: true });
});

// Delete an item
exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await req.app.locals.db.collection('items').deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Item not found' });
  res.json({ success: true });
});

const asyncHandler = require('../middlewares/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const { collection } = req.params;
  const result = await req.app.locals.db
    .collection(collection)
    .insertOne(req.body);
  res.status(201).json({ insertedId: result.insertedId });
});

const get = asyncHandler(async (req, res) => {
  const { collection, id } = req.params;
  const doc = await req.app.locals.db
    .collection(collection)
    .findOne({ _id: id });
  if (!doc) return res.status(404).json({ message: 'not found' });
  res.json(doc);
});

const update = asyncHandler(async (req, res) => {
  const { collection, id } = req.params;
  const result = await req.app.locals.db
    .collection(collection)
    .findOneAndUpdate({ _id: id }, { $set: req.body }, { returnDocument: 'after' });
  if (!result.value) return res.status(404).json({ message: 'not found' });
  res.json(result.value);
});

const remove = asyncHandler(async (req, res) => {
  const { collection, id } = req.params;
  const result = await req.app.locals.db
    .collection(collection)
    .deleteOne({ _id: id });
  if (result.deletedCount === 0) return res.status(404).json({ message: 'not found' });
  res.json({ deleted: id });
});

module.exports = { create, get, update, remove };

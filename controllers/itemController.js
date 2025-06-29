const Item = require('../models/Item');

exports.listItems = async (req, res) => {
  const items = await Item.find().lean();
  res.json(items);
};

exports.getItem = async (req, res) => {
  const item = await Item.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
};

exports.createItem = async (req, res) => {
  const item = await Item.create(req.body);
  res.status(201).json(item);
};

exports.updateItem = async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
};

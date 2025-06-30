const path = require('path');
const fs = require('fs');
const os = require('os');
const xlsx = require('xlsx');
const multerImport = require('multer');
const multer = multerImport.default || multerImport;
const asyncHandler = require('./../middlewares/asyncHandler');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `supply_${Date.now()}${path.extname(file.originalname)}`),
});
exports.upload = multer({ storage }).single('excelFile');

function parseExcel(filePath) {
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: true });
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h).trim());
  const optionIdx = headers.findIndex((h) => /option id/i.test(h));
  const priceIdx = headers.findIndex((h) => /supply/i.test(h) || /공급가/i.test(h));
  return rows.slice(1).map((r) => ({
    optionId: String(r[optionIdx] || '').trim(),
    supplyPrice: Number(r[priceIdx]) || 0,
  })).filter((r) => r.optionId);
}

exports.uploadExcel = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: '파일이 없습니다.' });
  }
  const filePath = req.file.path;
  const data = parseExcel(filePath);
  const bulk = data.map((d) => ({
    updateOne: {
      filter: { optionId: d.optionId },
      update: { $set: d },
      upsert: true,
    },
  }));
  if (bulk.length) await db.collection('coupangSupply').bulkWrite(bulk);
  fs.unlink(filePath, () => {});
  res.json({ status: 'success' });
});

exports.downloadExcel = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const list = await db.collection('coupangSupply').find().toArray();
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(list.map((d) => ({ optionId: d.optionId, supplyPrice: d.supplyPrice })));
  xlsx.utils.book_append_sheet(wb, ws, 'Supply');
  const tempPath = path.join(os.tmpdir(), `supply_${Date.now()}.xlsx`);
  xlsx.writeFile(wb, tempPath);
  res.download(tempPath, 'coupang_supply.xlsx', () => fs.unlink(tempPath, () => {}));
});

exports.getList = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const supply = await db.collection('coupangSupply').find().toArray();
  const stock = await db.collection('coupang').find().project({ 'Option ID': 1, 'Orderable quantity (real-time)': 1 }).toArray();
  const qtyMap = {};
  stock.forEach((s) => { qtyMap[s['Option ID']] = Number(s['Orderable quantity (real-time)'] || 0); });
  const totalStockValue = supply.reduce((sum, s) => sum + (Number(s.supplyPrice) || 0) * (qtyMap[s.optionId] || 0), 0);
  res.json({ data: supply, totalStockValue });
});

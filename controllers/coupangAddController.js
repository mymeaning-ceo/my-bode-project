const path = require('path');
const multerImport = require('multer');
const multer = multerImport.default || multerImport;
const xlsx = require('xlsx');
const fs = require('fs');
const asyncHandler = require('../middlewares/asyncHandler');
const { saveDailyAdCost } = require('../services/cronJobs');

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `excel_${Date.now()}${path.extname(file.originalname)}`)
});
exports.upload = multer({ storage }).single('excelFile');

const DEFAULT_COLUMNS = [
  '날짜',
  '광고집행 옵션ID',
  '광고집행 상품명',
  '노출수',
  '클릭수',
  '광고비',
  '클릭률',
];

function normalizeItemFields(item) {
  const normalized = { ...item };
  DEFAULT_COLUMNS.forEach((col) => {
    if (!(col in normalized)) normalized[col] = '';
  });
  return normalized;
}

// 상품명 정규화 (쉼표 기준 앞부분만)
function normalizeProductName(fullName = '') {
  const idx = fullName.indexOf(',');
  return idx >= 0 ? fullName.slice(0, idx).trim() : fullName;
}

// Render page
exports.renderPage = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const mode = req.query.mode === 'summary' ? 'summary' : 'detail';

  const search =
    typeof req.query.search === 'string'
      ? req.query.search
      : req.query.search?.value || '';
  const brand = req.query.brand || '';
  // 기본 정렬: 노출수 합 내림차순
  const sortField = req.query.sort || 'impressions';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;

  let list = [];

  if (mode === 'summary') {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const basePipeline = [
      {
        $addFields: {
          trimmedName: {
            $trim: {
              input: {
                $arrayElemAt: [{ $split: ['$광고집행 상품명', ','] }, 0],
              },
            },
          },
        },
      },
      brand
        ? {
            $match: {
              trimmedName: { $regex: brand, $options: 'i' },
            },
          }
        : null,
      search
        ? {
            $match: {
              trimmedName: { $regex: search, $options: 'i' },
            },
          }
        : null,
      {
        $group: {
          _id: '$trimmedName',
          impressions: { $sum: '$노출수' },
          clicks: { $sum: '$클릭수' },
          adCost: { $sum: '$광고비' },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
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
        },
      },
    ].filter(Boolean);

    const sortStage = { $sort: { [sortField]: sortOrder } };
    const countPipeline = [...basePipeline, sortStage, { $count: 'total' }];
    const dataPipeline = [...basePipeline, sortStage, { $skip: skip }, { $limit: limit }];

    const [countResult, data] = await Promise.all([
      db.collection('coupangAdd').aggregate(countPipeline, { allowDiskUse: true }).toArray(),
      db.collection('coupangAdd').aggregate(dataPipeline, { allowDiskUse: true }).toArray(),
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    list = data.map((item, i) => ({
      no: skip + i + 1,
      productName: item.name,
      impressions: item.impressions,
      clicks: item.clicks,
      adCost: item.adCost,
      ctr: item.ctr,
    }));

    return res.render('coupang-add-summary', {
      mode,
      list,
      search,
      brand,
      sortField,
      sortOrder,
      page,
      totalPages,
    });
  }

  // detail 모드 화면
  res.render('coupangAdd', {
    mode,
    search,
    brand,
  });
});

// DataTables API
exports.getData = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const start = parseInt(req.query.start, 10) || 0;
  const length = parseInt(req.query.length, 10) || 50;
  const draw = parseInt(req.query.draw, 10) || 1;
  const keyword =
    typeof req.query.search === 'string'
      ? req.query.search
      : req.query.search?.value || '';
  const brand = req.query.brand || '';

  // 기본 정렬 기준
  let sort = { _id: -1 };

  // DataTables에서 전달된 정렬 정보 적용
  if (
    req.query.order && Array.isArray(req.query.order) &&
    req.query.columns && Array.isArray(req.query.columns)
  ) {
    const { column, dir } = req.query.order[0];
    const colIdx = parseInt(column, 10);
    const columnInfo = req.query.columns[colIdx];
    if (columnInfo && columnInfo.data) {
      sort = { [columnInfo.data]: dir === 'asc' ? 1 : -1 };
    }
  }

  const conditions = [];
  if (keyword) {
    conditions.push({
      $or: [
        { '광고집행 상품명': { $regex: keyword, $options: 'i' } },
        { '광고집행 옵션ID': { $regex: keyword, $options: 'i' } },
      ],
    });
  }
  if (brand) {
    conditions.push({ '광고집행 상품명': { $regex: brand, $options: 'i' } });
  }
  const filter = conditions.length ? { $and: conditions } : {};

  const [total, recordsFiltered, rows] = await Promise.all([
    db.collection('coupangAdd').countDocuments(),
    db.collection('coupangAdd').countDocuments(filter),
    db
      .collection('coupangAdd')
      .aggregate(
        [
          { $match: filter },
          { $sort: sort },
          { $skip: start },
          { $limit: length },
        ],
        { allowDiskUse: true }
      )
      .toArray(),
  ]);

  const normalizedRows = rows.map((r) => normalizeItemFields(r));

  res.json({
    draw,
    recordsTotal: total,
    recordsFiltered,
    data: normalizedRows,
  });
});

// Excel upload for web route
exports.uploadExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).send('❌ 파일이 업로드되지 않았습니다.');
  }
  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const raw = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const numericFields = ['노출수', '클릭수', '광고비', '클릭률'];
  const data = raw.map(row => {
    numericFields.forEach(f => {
      if (row[f] !== undefined && row[f] !== null && row[f] !== '') {
        const num = Number(String(row[f]).replace(/[^0-9.-]/g, ''));
        row[f] = f === '클릭률' ? Number(num.toFixed(2)) : num;
      }
    });

    const dateVal = row['날짜'];
    if (dateVal instanceof Date) {
      row['날짜'] = dateVal.toISOString().slice(0, 10);
    } else if (typeof dateVal === 'string') {
      const d = new Date(dateVal);
      if (!Number.isNaN(d.getTime())) {
        row['날짜'] = d.toISOString().slice(0, 10);
      }
    }

    return normalizeItemFields(row);
  });

  const db = req.app.locals.db;
  await db.collection('coupangAdd').deleteMany({});
  if (data.length > 0) await db.collection('coupangAdd').insertMany(data);
  await saveDailyAdCost(db);

  fs.unlink(filePath, () => {});
  if (req.flash) req.flash('성공메시지', '✅ 업로드 완료');
  res.redirect('/coupang/add');
});

// Excel upload API
exports.uploadExcelApi = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: '파일이 없습니다.' });
  }
  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const raw = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const numericFields = ['노출수', '클릭수', '광고비', '클릭률'];
  const data = raw.map(row => {
    numericFields.forEach(f => {
      if (row[f] !== undefined && row[f] !== null && row[f] !== '') {
        const num = Number(String(row[f]).replace(/[^0-9.-]/g, ''));
        row[f] = f === '클릭률' ? Number(num.toFixed(2)) : num;
      }
    });

    const dateVal = row['날짜'];
    if (dateVal instanceof Date) {
      row['날짜'] = dateVal.toISOString().slice(0, 10);
    } else if (typeof dateVal === 'string') {
      const d = new Date(dateVal);
      if (!Number.isNaN(d.getTime())) {
        row['날짜'] = d.toISOString().slice(0, 10);
      }
    }

    return normalizeItemFields(row);
  });

  const db = req.app.locals.db;
  await db.collection('coupangAdd').deleteMany({});
  if (data.length > 0) await db.collection('coupangAdd').insertMany(data);
  await saveDailyAdCost(db);

  fs.unlink(filePath, () => {});
  res.json({ status: 'success' });
});

// Get single document by ID
exports.getItem = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const row = await db
    .collection('coupangAdd')
    .findOne({ _id: new require('mongodb').ObjectId(req.params.id) });
  if (!row) return res.status(404).json({ message: 'Not found' });
  res.json(row);
});

// Update document by ID
exports.updateItem = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const result = await db.collection('coupangAdd').updateOne(
    { _id: new require('mongodb').ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (result.matchedCount === 0)
    return res.status(404).json({ message: 'Not found' });
  res.json({ success: true });
});

// Get product summary
exports.getProductSummary = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const rows = await db.collection('coupangAdd').aggregate([
    {
      $addFields: {
        trimmedName: {
          $trim: { input: { $arrayElemAt: [{ $split: ['$광고집행 상품명', ','] }, 0] } }
        }
      }
    },
    {
      $group: {
        _id: '$trimmedName',
        노출수: { $sum: '$노출수' },
        클릭수: { $sum: '$클릭수' },
        광고비: { $sum: '$광고비' }
      }
    },
    {
      $project: {
        _id: 0,
        상품명: '$_id',
        노출수: 1,
        클릭수: 1,
        광고비: 1,
        클릭률: {
          $cond: [
            { $gt: ['$노출수', 0] },
            { $round: [{ $multiply: [{ $divide: ['$클릭수', '$노출수'] }, 100] }, 2] },
            0
          ]
        }
      }
    },
    { $sort: { 노출수: -1 } }
  ]).toArray();
  res.json(rows);
});

// Get date summary
exports.getDateSummary = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const rows = await db.collection('coupangAdd').aggregate([
    {
      $group: {
        _id: '$날짜',
        광고비: { $sum: '$광고비' }
      }
    },
    {
      $project: {
        _id: 0,
        날짜: {
          $cond: [
            { $eq: [{ $type: '$_id' }, 'date'] },
            { $dateToString: { format: '%Y-%m-%d', date: '$_id' } },
            '$_id'
          ]
        },
        광고비: 1
      }
    },
    { $sort: { 날짜: 1 } }
  ]).toArray();
  res.json(rows);
});

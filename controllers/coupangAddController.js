const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const { addJob } = require('../lib/jobQueue');
const asyncHandler = require('../middlewares/asyncHandler');

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
  const allowedModes = ['summary', 'daily'];
  const mode = allowedModes.includes(req.query.mode) ? req.query.mode : 'detail';

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
  } else if (mode === 'daily') {
    const data = await db
      .collection('coupangAdd')
      .aggregate([
        brand
          ? { $match: { '광고집행 상품명': { $regex: brand, $options: 'i' } } }
          : null,
        {
          $group: {
            _id: '$날짜',
            adCost: { $sum: '$광고비' },
          },
        },
        { $project: { _id: 0, date: '$_id', adCost: 1 } },
        { $sort: { date: 1 } },
      ].filter(Boolean))
      .toArray();

    list = data.map((d) => ({
      date: d.date instanceof Date ? d.date.toISOString().slice(0, 10) : d.date,
      adCost: d.adCost,
    }));

    return res.render('coupang-add-daily', { mode, list, brand });
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
    return res.status(400).json({ message: '파일이 없습니다.' });
  }

  const jobId = addJob('coupangAdd', req.file.path, req.app.locals.db);
  res.json({ jobId });
});

// Excel upload API
exports.uploadExcelApi = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '파일이 없습니다.' });
  }

  const jobId = addJob('coupangAdd', req.file.path, req.app.locals.db);
  res.json({ jobId });
});

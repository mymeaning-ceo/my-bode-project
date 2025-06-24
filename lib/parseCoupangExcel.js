const safeReadXlsx = require('./safeReadXlsx');
const xlsx = require('xlsx');

function toNumber(val) {
  const num = Number(String(val).replace(/[,▲▼]/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Parse Coupang Excel file and return array of item objects
 * @param {string} filePath
 * @returns {Array<Object>}
 */
function parseCoupangExcel(filePath) {
  const workbook = safeReadXlsx(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  if (rows.length < 2) return [];

  const headers = rows[1].map((h) => String(h).trim());

  // find the index of a column header by matching against several possible names
  // whitespace and case differences are ignored and partial matches are allowed
  const findIndex = (names) =>
    headers.findIndex((h) => {
      const normalized = String(h).replace(/\s+/g, '').toLowerCase();
      return names.some((n) => normalized.includes(String(n).replace(/\s+/g, '').toLowerCase()));
    });

  const optionIdIdx = findIndex(['Option ID', '옵션ID']);
  const productNameIdx = findIndex(['Product name', '상품명']);
  const optionNameIdx = findIndex(['Option name', '옵션명']);
  const inventoryIdx = findIndex(['Orderable quantity (real-time)', '재고량']);
  const salesAmountIdx = findIndex([
    'Sales amount on the last 30 days',
    '30일 판매금액',
    '최근 30일 판매금액',
    '최근30일판매금액',
  ]);
  const salesCountIdx = findIndex([
    'Sales in the last 30 days',
    '30일 판매량',
    '최근 30일 판매량',
    '최근30일판매량',
  ]);

  return rows
    .slice(2)
    .map((row) => {
      const obj = {};
      obj['Option ID'] = String(row[optionIdIdx] ?? '').trim();
      obj['Product name'] = row[productNameIdx] ?? '';
      obj['Option name'] = row[optionNameIdx] ?? '';

      const inventory = toNumber(row[inventoryIdx]);
      obj['Orderable quantity (real-time)'] = inventory;

      const salesAmount = toNumber(row[salesAmountIdx]);
      obj['Sales amount on the last 30 days'] = salesAmount;

      const salesCount = toNumber(row[salesCountIdx]);
      obj['Sales in the last 30 days'] = salesCount;

      // 부족재고량 계산
      const daily = salesCount / 30;
      const safety = daily * 7;
      obj['Shortage quantity'] = inventory < safety ? Math.ceil(safety - inventory) : 0;

      return obj;
    })
    .filter((item) => item['Option ID']);
}

module.exports = parseCoupangExcel;

const safeReadXlsx = require('./safeReadXlsx');
const xlsx = require('xlsx');

/**
 * Parse Coupang Excel file and return array of item objects
 * @param {string} filePath
 * @returns {Array<Object>}
 */
function parseCoupangExcel(filePath) {
  const workbook = safeReadXlsx(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  if (!rows.length) return [];

  let headerIdx = rows.findIndex((r) =>
    r.some((c) => typeof c === 'string' && c.includes('Option ID'))
  );
  if (headerIdx === -1) headerIdx = 1;

  const header = rows[headerIdx];
  const dataRows = rows.slice(headerIdx + 1);

  const indexOf = (label, fallback) => {
    const idx = header.findIndex((h) => typeof h === 'string' && h.includes(label));
    return idx === -1 ? fallback : idx;
  };

  const idIdx = indexOf('Option ID', 2);
  const productIdx = indexOf('Product name', 4);
  const optionIdx = indexOf('Option name', 5);
  const inventoryIdx = indexOf('Orderable quantity', 7);
  const amountIdx = indexOf('Sales amount', 11);
  const countIdx = indexOf('Sales in', 13);

  return dataRows
    .map((row) => {
      const obj = {};
      obj['Option ID'] = String(row[idIdx] ?? '').trim();
      obj['Product name'] = row[productIdx] ?? '';
      obj['Option name'] = row[optionIdx] ?? '';

      const inventory = Number(String(row[inventoryIdx]).replace(/,/g, '')) || 0;
      obj['Orderable quantity (real-time)'] = inventory;

      const salesAmount = Number(String(row[amountIdx]).replace(/,/g, '')) || 0;
      obj['Sales amount on the last 30 days'] = salesAmount;

      const salesCount = Number(String(row[countIdx]).replace(/,/g, '')) || 0;
      obj['Sales in the last 30 days'] = salesCount;

      const daily = salesCount / 30;
      const safety = daily * 7;
      obj['Shortage quantity'] = inventory < safety ? Math.ceil(safety - inventory) : 0;

      return obj;
    })
    .filter((item) => item['Option ID']);
}

module.exports = parseCoupangExcel;

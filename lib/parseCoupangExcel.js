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
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }).slice(2);
  return rows
    .map((row) => {
      const obj = {};
      obj['Option ID'] = String(row[2] ?? '').trim();
      obj['Product name'] = row[4] ?? '';
      obj['Option name'] = row[5] ?? '';

      const inventory = Number(String(row[7]).replace(/,/g, '')) || 0;
      obj['Orderable quantity (real-time)'] = inventory;

      // 30일 판매금액은 옵션 ID 행 기준으로 10번째 값
      const salesAmount = Number(String(row[9]).replace(/,/g, '')) || 0;
      obj['Sales amount on the last 30 days'] = salesAmount;

      // 30일 판매량은 옵션 ID 행 기준으로 12번째 값
      const salesCount = Number(String(row[11]).replace(/,/g, '')) || 0;
      obj['Sales in the last 30 days'] = salesCount;

      const daily = salesCount / 30;
      const safety = daily * 7;
      obj['Shortage quantity'] = inventory < safety ? Math.ceil(safety - inventory) : 0;

      return obj;
    })
    .filter((item) => item['Option ID']);
}

module.exports = parseCoupangExcel;

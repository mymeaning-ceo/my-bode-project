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
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }).slice(2);

  return rows
    .map((row) => {
      const obj = {};
      obj['Option ID'] = String(row[2] ?? '').trim();
      obj['Product name'] = row[4] ?? '';
      obj['Option name'] = row[5] ?? '';

      const inventory = toNumber(row[7]);   // ✅ 8번째 열: 재고 수량
      obj['Orderable quantity (real-time)'] = inventory;

      const salesAmount = toNumber(row[11]); // ✅ 12번째 열: 30일 판매금액
      obj['Sales amount on the last 30 days'] = salesAmount;

      const salesCount = toNumber(row[13]);  // ✅ 14번째 열: 30일 판매량
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

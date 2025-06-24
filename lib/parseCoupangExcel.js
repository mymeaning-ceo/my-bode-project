const safeReadXlsx = require('./safeReadXlsx');
const xlsx = require('xlsx');

// 숫자 변환 함수 개선: 문자열 숫자, 쉼표, 원화, 공백 모두 제거
function toNumber(val) {
  if (val === undefined || val === null) return 0;

  // 숫자형이면 그대로 반환
  if (typeof val === 'number') return val;

  // 문자열인 경우: 쉼표, 원, 공백 제거
  const cleaned = String(val).replace(/[^0-9.\-]/g, '');
  const num = Number(cleaned);
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
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

  if (rows.length < 2) return [];

  // 헤더 행 인덱스 탐색
  const headerRowIdx = rows.findIndex((r) =>
    r.some((c) =>
      String(c).replace(/\s+/g, '').toLowerCase().includes('optionid')
    )
  );
  if (headerRowIdx === -1) return [];

  const headers = rows[headerRowIdx].map((h) => String(h).trim());

  // 헤더명 검색 함수
  const findIndex = (names) =>
    headers.findIndex((h) => {
      const normalized = String(h).replace(/\s+/g, '').toLowerCase();
      return names.some((n) => normalized.includes(String(n).replace(/\s+/g, '').toLowerCase()));
    });

  // 주요 열 인덱스
  const optionIdIdx = findIndex(['Option ID', '옵션ID']);
  const productNameIdx = findIndex(['Product name', '상품명']);
  const optionNameIdx = findIndex(['Option name', '옵션명']);
  const offerCondIdx = findIndex(['Offer condition', '상품상태', '판매상태']);
  const inventoryIdx = findIndex(['Orderable quantity (real-time)', '재고량']);
  const salesAmountIdx = findIndex([
    'Sales amount on the last 30 days',
    '30일 판매금액',
    '최근 30일 판매금액',
    '최근30일판매금액'
  ]);
  const salesCountIdx = findIndex([
    'Sales in the last 30 days',
    '30일 판매량',
    '최근 30일 판매량',
    '최근30일판매량'
  ]);

  // 본문 데이터 가공
  return rows
    .slice(headerRowIdx + 1)
    .map((row) => {
      const obj = {};

      obj['Option ID'] = String(row[optionIdIdx] ?? '').trim();
      obj['Product name'] = row[productNameIdx] ?? '';
      obj['Option name'] = row[optionNameIdx] ?? '';

      const condition = String(row[offerCondIdx] ?? '').trim();
      obj['Offer condition'] = condition || 'NEW';

      const inventory = toNumber(row[inventoryIdx]);
      obj['Orderable quantity (real-time)'] = inventory;

      const salesAmount = salesAmountIdx !== -1 ? toNumber(row[salesAmountIdx]) : 0;
      obj['Sales amount on the last 30 days'] = salesAmount;

      const salesCount = salesCountIdx !== -1 ? toNumber(row[salesCountIdx]) : 0;
      obj['Sales in the last 30 days'] = salesCount;

      const daily = salesCount / 30;
      const safety = daily * 7;
      const isNew = condition.toUpperCase() === 'NEW' || condition === '';
      obj['Shortage quantity'] =
        isNew && inventory < safety ? Math.ceil(safety - inventory) : 0;

      return obj;
    })
    .filter((item) => item['Option ID']); // 필수 필드 기준 필터링
}

module.exports = parseCoupangExcel;

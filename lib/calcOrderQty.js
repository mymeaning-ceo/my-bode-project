const xlsx = require('xlsx');

function readFirstSheet(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet, { defval: null });
}

function toNumber(val) {
  const num = Number(String(val).replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

function compute(adPath, inventoryPath, options = {}) {
  const leadTime = options.leadTimeDays || 5; // 주문→입고까지 걸리는 일수
  const safetyDays = options.safetyDays || 3; // 안전재고 일수
  const adRate = options.adRate || 0.2; // 기본 광고 기여율

  const adRows = readFirstSheet(adPath);
  const invRows = readFirstSheet(inventoryPath);

  const adMap = new Map();
  for (const row of adRows) {
    const id = row['광고집행 옵션ID'] || row['option_id'] || row['Option ID'];
    if (!id) continue;
    const clicks = toNumber(row['클릭수']);
    const cpc = toNumber(row['클릭당 단가'] || row['CPC'] || row['클릭당단가']);
    const conversions = toNumber(row['전환수']);
    const spend = clicks * cpc;

    if (!adMap.has(id)) adMap.set(id, { option_id: id, clicks: 0, conversions: 0, spend: 0 });
    const agg = adMap.get(id);
    agg.clicks += clicks;
    agg.conversions += conversions;
    agg.spend += spend;
  }

  const invMap = new Map();
  for (const row of invRows) {
    const id = row['Option ID'] || row['option_id'] || row['옵션ID'] || row['광고집행 옵션ID'];
    if (!id) continue;
    invMap.set(id, row);
  }

  const allIds = new Set([...invMap.keys(), ...adMap.keys()]);
  const results = [];

  for (const id of allIds) {
    const adInfo = adMap.get(id) || { clicks: 0 };
    const inv = invMap.get(id) || {};

    // 판매량: 우선 최근 7일, 없으면 최근 30일 기준
    const sales7 = toNumber(inv['최근 7일 판매량'] || inv['최근7일 판매량']);
    const sales30 = toNumber(inv['최근 30일 판매량'] || inv['Sales in the last 30 days']);
    const dailySales = sales7 > 0 ? sales7 / 7 : sales30 / 30;

    const adjustedDaily = dailySales * (1 + (adInfo.clicks > 0 ? adRate : 0));

    const stock = toNumber(
      inv['Orderable quantity (real-time)'] ||
        inv['현재 출고 가능 수량'] ||
        inv['현재고']
    );
    const inbound = toNumber(inv['Pending inbounds (real-time)'] || inv['입고 예정 수량'] || inv['입고 예정']);

    const daysToOOS = adjustedDaily > 0 ? stock / adjustedDaily : Infinity;
    const orderPoint = leadTime + safetyDays;

    const required = adjustedDaily * orderPoint;
    const shortage = Math.max(0, Math.ceil(required - stock - inbound));

    results.push({
      option_id: id,
      daily_sales: Number(dailySales.toFixed(2)),
      adjusted_daily_sales: Number(adjustedDaily.toFixed(2)),
      days_to_oos: Number(daysToOOS.toFixed(2)),
      required_stock: Math.ceil(required),
      shortage_qty: shortage,
      order_needed: daysToOOS < orderPoint,
    });
  }

  return results;
}

module.exports = compute;

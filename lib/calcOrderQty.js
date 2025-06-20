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
  const leadTime = options.leadTimeDays || 7;
  const safetyStock = options.safetyStock || 20;

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

  const results = [];
  for (const [id, info] of adMap.entries()) {
    const avgDaily = info.conversions / 7;
    const demandMultiplier = Math.min(2.0, 1 + info.spend / 10000);
    const adjusted = avgDaily * demandMultiplier;
    const required = adjusted * leadTime + safetyStock;

    const inv = invMap.get(id) || {};
    const stock = toNumber(inv['Orderable quantity (real-time)'] || inv['현재 출고 가능 수량']);
    const inbound = toNumber(inv['Pending inbounds (real-time)'] || inv['입고 예정 수량']);
    const returns = toNumber(inv['Customer returns last 30 days (D-1)'] || inv['최근 반품 수량']);
    const available = stock + inbound - returns;
    const orderQty = Math.max(0, Math.ceil(required - available));

    results.push({
      option_id: id,
      avg_daily_sales: Number(avgDaily.toFixed(2)),
      demand_multiplier: Number(demandMultiplier.toFixed(2)),
      required_stock: Math.ceil(required),
      available_stock: available,
      order_qty: orderQty,
    });
  }

  return results;
}

module.exports = compute;

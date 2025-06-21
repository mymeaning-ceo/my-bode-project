const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const compute = require('../lib/calcOrderQty');

test('compute shortage calculation from sample excels', () => {
  const tmpDir = path.join(__dirname, 'fixtures');
  const adPath = path.join(tmpDir, 'ad_tmp.xlsx');
  const invPath = path.join(tmpDir, 'inv_tmp.xlsx');

  const adData = [
    { '광고집행 옵션ID': 'A123', 클릭수: 10 },
  ];
  const wbAd = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wbAd, xlsx.utils.json_to_sheet(adData), 'Sheet1');
  xlsx.writeFile(wbAd, adPath);

  const invData = [
    {
      'Option ID': 'A123',
      '최근 7일 판매량': 21,
      'Orderable quantity (real-time)': 5,
      'Pending inbounds (real-time)': 0,
    },
  ];
  const wbInv = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wbInv, xlsx.utils.json_to_sheet(invData), 'Sheet1');
  xlsx.writeFile(wbInv, invPath);

  const result = compute(adPath, invPath, { leadTimeDays: 5, safetyDays: 3, adRate: 0.2 });
  expect(result).toHaveLength(1);
  const item = result[0];
  expect(item.option_id).toBe('A123');
  expect(item.shortage_qty).toBe(24);
  expect(item.days_to_oos).toBeCloseTo(1.39, 2);


  fs.unlinkSync(adPath);
  fs.unlinkSync(invPath);
});

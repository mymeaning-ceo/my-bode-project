const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const compute = require('../lib/calcOrderQty');

test('compute order quantity from sample excels', () => {
  const tmpDir = path.join(__dirname, 'fixtures');
  const adPath = path.join(tmpDir, 'ad_tmp.xlsx');
  const invPath = path.join(tmpDir, 'inv_tmp.xlsx');

  const adData = [
    { '광고집행 옵션ID': '123', 클릭수: 10, '클릭당 단가': 100, 전환수: 7 },
    { '광고집행 옵션ID': '123', 클릭수: 5, '클릭당 단가': 100, 전환수: 0 },
  ];
  const wbAd = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wbAd, xlsx.utils.json_to_sheet(adData), 'Sheet1');
  xlsx.writeFile(wbAd, adPath);

  const invData = [
    {
      'Option ID': '123',
      'Orderable quantity (real-time)': 5,
      'Pending inbounds (real-time)': 10,
      'Customer returns last 30 days (D-1)': 0,
    },
  ];
  const wbInv = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wbInv, xlsx.utils.json_to_sheet(invData), 'Sheet1');
  xlsx.writeFile(wbInv, invPath);

  const result = compute(adPath, invPath);
  expect(result).toHaveLength(1);
  const item = result[0];
  expect(item.option_id).toBe('123');
  expect(item.order_qty).toBe(14);
  expect(item.required_stock).toBe(29);

  fs.unlinkSync(adPath);
  fs.unlinkSync(invPath);
});

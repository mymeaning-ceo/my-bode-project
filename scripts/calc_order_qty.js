#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const compute = require('../lib/calcOrderQty');
const xlsx = require('xlsx');

const [adFile, invFile, outFile] = process.argv.slice(2);
if (!adFile || !invFile) {
  console.error('Usage: node calc_order_qty.js <ad_excel> <inventory_excel> [out_excel]');
  process.exit(1);
}

const results = compute(adFile, invFile);
if (outFile) {
  const ws = xlsx.utils.json_to_sheet(results);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'orders');
  xlsx.writeFile(wb, outFile);
  console.log('Saved', outFile);
} else {
  console.log(JSON.stringify(results, null, 2));
}

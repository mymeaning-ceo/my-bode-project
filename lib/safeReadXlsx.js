const fs = require('fs');
const xlsx = require('xlsx');

/**
 * Reads an XLSX file while suppressing noisy unzip warnings from the xlsx/cfb libraries.
 * @param {string} filePath - Path to the XLSX file to read.
 * @returns {object} Parsed workbook instance.
 */
function safeReadXlsx(filePath) {
  const originalError = console.error;
  console.error = function (...args) {
    const msg = args[0];
    if (typeof msg === 'string' &&
        (/^Bad (uncompressed|compressed) size/.test(msg) || msg.startsWith('Bad CRC32 checksum'))) {
      return;
    }
    originalError.apply(console, args);
  };
  try {
    const data = fs.readFileSync(filePath);
    return xlsx.read(data, { type: 'buffer' });
  } finally {
    console.error = originalError;
  }
}

module.exports = safeReadXlsx;

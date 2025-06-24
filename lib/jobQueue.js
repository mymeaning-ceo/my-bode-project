const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const parseCoupangExcel = require('./parseCoupangExcel');
const xlsx = require('xlsx');

const jobs = {};
const queue = [];
let processing = false;

function addJob(type, filePath, db, options = {}) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  jobs[id] = { progress: 0 };
  queue.push({ id, type, filePath, db, options });
  processQueue();
  return id;
}

function getProgress(id) {
  return jobs[id] ? jobs[id].progress : null;
}

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;
  const job = queue.shift();
  try {
    if (job.type === 'stock') {
      await handleStock(job);
    } else if (job.type === 'coupang') {
      await handleCoupang(job);
    } else if (job.type === 'coupangAdd') {
      await handleCoupangAdd(job);
    }
    jobs[job.id].progress = 100;
  } catch (err) {
    console.error('Job error:', err);
    jobs[job.id].progress = -1;
  }
  fs.unlink(job.filePath, () => {});
  processing = false;
  setImmediate(processQueue);
}

function handleStock({ filePath, db }) {
  return new Promise((resolve, reject) => {
    const PY_SCRIPT = path.join(__dirname, '../scripts/excel_to_mongo.py');
    const dbName = process.env.DB_NAME || 'forum';
    const python = spawn('python', ['-u', PY_SCRIPT, filePath, dbName, 'stock'], {
      shell: true,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', MONGO_URI: process.env.MONGO_URI }
    });
    python.on('close', async (code) => {
      if (code === 0) {
        await db.collection('stock').updateMany({}, {
          $set: { createdAt: new Date() }
        });
        resolve();
      } else {
        reject(new Error('python error'));
      }
    });
    python.on('error', reject);
  });
}

async function handleCoupang({ filePath, db }) {
  const data = parseCoupangExcel(filePath);
  const bulkOps = data.map((item) => ({
    updateOne: {
      filter: { 'Option ID': item['Option ID'] },
      update: { $set: item },
      upsert: true
    }
  }));
  if (bulkOps.length) await db.collection('coupang').bulkWrite(bulkOps);
}

async function handleCoupangAdd({ filePath, db }) {
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = xlsx.utils.sheet_to_json(sheet);
  const numericFields = ['노출수', '클릭수', '광고비', '클릭률'];
  const data = raw.map((row) => {
    numericFields.forEach((f) => {
      if (row[f] !== undefined && row[f] !== null && row[f] !== '') {
        const num = Number(String(row[f]).replace(/[^0-9.-]/g, ''));
        row[f] = f === '\u클릭률' ? Number(num.toFixed(2)) : num;
      }
    });
    return row;
  });
  await db.collection('coupangAdd').deleteMany({});
  if (data.length) await db.collection('coupangAdd').insertMany(data);
}

module.exports = { addJob, getProgress };

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const csv = require('csvtojson');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME   = 'try_brand';
const COLLECTION= 'inventory';

async function runPython(scriptPath, excelPath) {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [scriptPath, excelPath]);
    py.stderr.on('data', data => console.error(data.toString()));
    py.on('close', code => (code === 0 ? resolve() : reject(new Error('Python script error'))));
  });
}

async function csvToJson(csvPath) {
  return csv().fromFile(csvPath);
}

exports.uploadAndProcess = async (req, res) => {
  try {
    // 1) 업로드된 엑셀 임시 경로
    const excelPath = req.file.path;

    // 2) 파이썬 스크립트 경로
    const scriptPath = path.join(__dirname, '../python/transform_try.py');

    // 3) 파이썬 실행 (엑셀 → CSV 변환)
    await runPython(scriptPath, excelPath);

    // 4) CSV 결과 읽기
    const csvPath = path.join(path.dirname(excelPath), 'try_long_format.csv');
    if (!fs.existsSync(csvPath)) throw new Error('CSV not found');

    const records = await csvToJson(csvPath);

    // 5) MongoDB 저장
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const col = client.db(DB_NAME).collection(COLLECTION);
    if (records.length) await col.insertMany(records);
    await client.close();

    res.json({ status: 'ok', inserted: records.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

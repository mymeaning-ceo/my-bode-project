// upload.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');

const region = process.env.S3_REGION || 'ap-northeast-2';
const bucket = process.env.S3_BUCKET || 'wonhochoi1';

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  }
});

async function checkBucketConnection() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Connected to S3 bucket: ${bucket}`);
  } catch (err) {
    console.error(`S3 bucket "${bucket}" connection failed:`, err.message);
  }
}

checkBucketConnection();

const upload = multer({
  storage: multerS3({
    s3,
    bucket,
    key: function (req, file, cb) {
      cb(null, Date.now().toString());
    }
  })
});

module.exports = upload;

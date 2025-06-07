<<<<<<< HEAD
// upload.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'ap-northeast-2',
=======
// upload.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');

const region = process.env.S3_REGION || 'ap-northeast-2';
const bucket = process.env.S3_BUCKET || 'wonhochoi1';

const s3 = new S3Client({
  region,
>>>>>>> e64b824c86d54036124f4af898c95dcecdd5cd57
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  }
});

<<<<<<< HEAD
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'wonhochoi',
=======
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
>>>>>>> e64b824c86d54036124f4af898c95dcecdd5cd57
    key: function (req, file, cb) {
      cb(null, Date.now().toString());
    }
  })
});

module.exports = upload;

require('dotenv').config();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  }
});

const bucketName = process.env.S3_BUCKET_NAME;
if (!bucketName || !process.env.S3_KEY || !process.env.S3_SECRET) {
  throw new Error('Missing S3 configuration in .env');
}

const upload = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    acl: undefined, // ✅ ACL 명시적 제거
    key: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  })
});


module.exports = upload;

// upload.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand
} = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  }
});

const bucketName = process.env.S3_BUCKET_NAME;
if (!bucketName) {
  throw new Error('S3_BUCKET_NAME environment variable is not set');
}

async function ensureBucketExists() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (err) {
    if (err.$metadata && err.$metadata.httpStatusCode === 404) {
      await s3.send(new CreateBucketCommand({
        Bucket: bucketName,
        CreateBucketConfiguration: { LocationConstraint: 'ap-northeast-2' }
      }));
    } else {
      console.error('Error checking bucket:', err);
    }
  }
}

// Fire and forget check when module loads
ensureBucketExists().catch((err) => {
  console.error('Failed to ensure bucket exists', err);
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    key: function (req, file, cb) {
      cb(null, Date.now().toString());
    }
  })
});

module.exports = upload;

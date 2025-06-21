const path = require("path");
require("./config/loadEnv")();
const multer = require("multer");
const multerS3 = require("multer-s3");
const {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  waitUntilBucketExists,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
  },
});

const bucketName = process.env.S3_BUCKET_NAME;
if (
  !bucketName ||
  !process.env.S3_KEY ||
  !process.env.S3_SECRET ||
  !process.env.S3_REGION
) {
  throw new Error("Missing S3 configuration in .env");
}

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      await s3.send(
        new CreateBucketCommand({
          Bucket: bucketName,
          CreateBucketConfiguration: {
            LocationConstraint: process.env.S3_REGION,
          },
        }),
      );
      await waitUntilBucketExists(
        { client: s3, maxWaitTime: 10 },
        { Bucket: bucketName },
      );
    } else {
      console.error("S3 bucket check failed:", err);
      throw err;
    }
  }
}

ensureBucket().catch((err) => {
  console.error("Unable to ensure S3 bucket exists:", err);
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    acl: undefined, // ✅ ACL 명시적 제거
    key: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
});

module.exports = upload;

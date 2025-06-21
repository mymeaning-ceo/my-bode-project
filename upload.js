// upload.js
require("dotenv").config();
const multer = require("multer");

let upload;   // ← 공통 export용 변수

// ─────────────────────────────────────────
// 1) 테스트 환경: 메모리 스토리지만 사용
// ─────────────────────────────────────────
if (process.env.NODE_ENV === "test") {
  upload = multer({ storage: multer.memoryStorage() });
} else {
  // ───────────────────────────────────────
  // 2) 운영/개발 환경: S3 스토리지 사용
  // ───────────────────────────────────────
  const multerS3 = require("multer-s3");
  const {
    S3Client,
    HeadBucketCommand,
    CreateBucketCommand,
    waitUntilBucketExists,
  } = require("@aws-sdk/client-s3");

  // 필수 환경 변수 체크
  const { S3_KEY, S3_SECRET, S3_REGION, S3_BUCKET_NAME } = process.env;
  if (!S3_KEY || !S3_SECRET || !S3_REGION || !S3_BUCKET_NAME) {
    throw new Error("\u274C Missing S3 configuration in .env");
  }

  console.log("[DEBUG S3 CONFIG]", {
    S3_KEY,
    S3_SECRET,
    S3_REGION,
    S3_BUCKET_NAME,
  });

  const s3 = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_KEY,
      secretAccessKey: S3_SECRET,
    },
  });

  // 버킷 존재 확인 또는 생성
  async function ensureBucket() {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET_NAME }));
    } catch (err) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        await s3.send(
          new CreateBucketCommand({
            Bucket: S3_BUCKET_NAME,
            CreateBucketConfiguration: { LocationConstraint: S3_REGION },
          }),
        );
        await waitUntilBucketExists(
          { client: s3, maxWaitTime: 10 },
          { Bucket: S3_BUCKET_NAME },
        );
      } else {
        console.error("\u274C S3 bucket check failed:", err);
        throw err;
      }
    }
  }

  // 비동기 실행 (await 대신 후행 catch)
  ensureBucket().catch((err) =>
    console.error("\u274C Unable to ensure S3 bucket exists:", err),
  );

  // multer-S3 스토리지 설정
  upload = multer({
    storage: multerS3({
      s3,
      bucket: S3_BUCKET_NAME,
      acl: undefined, // ACL 제거(권장)
      key: (req, file, cb) =>
        cb(null, `${Date.now()}-${file.originalname}`),
    }),
  });
}

// 공통 export
module.exports = upload;

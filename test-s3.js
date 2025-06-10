require('dotenv').config();
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET
  }
});

(async () => {
  try {
    const data = await s3.send(new ListBucketsCommand({}));
    console.log('✅ S3 연결 성공, 버킷 목록:', data.Buckets.map(b => b.Name));
  } catch (err) {
    console.error('❌ S3 연결 실패:', err);
  }
})();
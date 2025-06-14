// jest.setup.js
// upload.js 모킹: S3 설정을 요구하지 않도록 차단
jest.mock("./upload", () => ({
    ensureBucket: jest.fn().mockResolvedValue(), // 필요한 최소 인터페이스
  }));
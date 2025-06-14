// jest.setup.js
// ─────────────────────────────────────────────
// 1) database.js 모킹 (함수 + then)
// ─────────────────────────────────────────────
jest.mock("./database", () => {
  const mockClient = { db: () => ({}) };
  const mockFn = jest.fn().mockResolvedValue(mockClient);
  mockFn.then = (fn) => fn(mockClient);
  return mockFn;
});

// ─────────────────────────────────────────────
// 2) config/db.js 모킹
// ─────────────────────────────────────────────
jest.mock("./config/db", () => {
  const mockClient = { db: () => ({}) };
  const mockConnect = jest.fn().mockResolvedValue(mockClient);
  mockConnect.then = (fn) => fn(mockClient);
  return {
    connectDB: mockConnect,
    closeDB: jest.fn().mockResolvedValue(),
  };
});

// ─────────────────────────────────────────────
// 3) upload.js 모킹 (S3 설정 우회)
// ─────────────────────────────────────────────
jest.mock("./upload", () => ({
  ensureBucket: jest.fn().mockResolvedValue(),
}));

// ─────────────────────────────────────────────
// 4) multer 모킹 (업로드 미들웨어 우회)
// ─────────────────────────────────────────────
jest.mock("multer", () => {
  const dummy = () => ({
    single: () => (req, res, next) => next(),
    array: () => (req, res, next) => next(),
    fields: () => (req, res, next) => next(),
  });
  dummy.single = () => (req, res, next) => next();
  dummy.array = () => (req, res, next) => next();
  dummy.fields = () => (req, res, next) => next();
  return dummy;
});

// ─────────────────────────────────────────────
// 5) 글로벌 타임아웃 설정
// ─────────────────────────────────────────────
jest.setTimeout(30000); // 30초
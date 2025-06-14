// jest.setup.js
// ─────────────────────────────────────────────
// 1) database.js 모킹 (함수 + then)
// ─────────────────────────────────────────────
jest.mock("./database", () => {
  const mockClient = { db: () => ({}) };
  const mockFn = jest.fn().mockResolvedValue(mockClient);
  mockFn.then = (fn) => fn(mockClient); // connectDB.then(...) 호환
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
// 3) upload.js 모킹 (S3 설정 우회 + single/array/fields 지원)
// ─────────────────────────────────────────────
jest.mock("./upload", () => ({
  ensureBucket: jest.fn().mockResolvedValue(),
  single: () => (req, res, next) => next(),
  array: () => (req, res, next) => next(),
  fields: () => (req, res, next) => next(),
}));

// ─────────────────────────────────────────────
// 4) multer 모킹 (single/array/fields/diskStorage 전부)
// ─────────────────────────────────────────────
jest.mock("multer", () => {
  const dummyMiddleware = () => ({
    single: () => (req, res, next) => next(),
    array: () => (req, res, next) => next(),
    fields: () => (req, res, next) => next(),
  });

  // 개별 메서드
  dummyMiddleware.single = () => (req, res, next) => next();
  dummyMiddleware.array = () => (req, res, next) => next();
  dummyMiddleware.fields = () => (req, res, next) => next();
  dummyMiddleware.diskStorage = () => ({});

  return dummyMiddleware;
});

// ─────────────────────────────────────────────
// 5) 글로벌 타임아웃
// ─────────────────────────────────────────────
jest.setTimeout(30000); // 30초
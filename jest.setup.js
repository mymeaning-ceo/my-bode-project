// jest.setup.js
// ─────────────────────────────────────────────
// 1) config/db.js 모킹
// ─────────────────────────────────────────────
jest.mock("./config/db", () => {
  const mockClient = { db: () => ({}) };
  const mockConnect = jest.fn().mockResolvedValue(mockClient);
  mockConnect.then = (fn) => fn(mockClient); // connectDB.then(...) 호환
  return {
    connectDB: mockConnect,
    closeDB: jest.fn().mockResolvedValue(),
  };
});

// ─────────────────────────────────────────────
// 2) connect-mongo 모킹 (세션 저장소 우회)
// ─────────────────────────────────────────────
jest.mock("connect-mongo", () => ({
  create: jest.fn(() => ({ get: jest.fn(), set: jest.fn(), destroy: jest.fn() })),
}));

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

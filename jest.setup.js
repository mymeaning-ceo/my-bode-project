// upload.js 모킹 (이미 추가된 부분)
jest.mock("./upload", () => ({
  ensureBucket: jest.fn().mockResolvedValue(),
}));

// multer 모킹 추가
jest.mock("multer", () => {
  const mockMulter = () => ({
    single: () => (req, res, next) => next(),
    array: () => (req, res, next) => next(),
    fields: () => (req, res, next) => next(),
  });
  mockMulter.single = () => (req, res, next) => next();
  mockMulter.array = () => (req, res, next) => next();
  mockMulter.fields = () => (req, res, next) => next();
  return mockMulter;
});
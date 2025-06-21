module.exports = {
  // Node.js 백엔드라면:
  testEnvironment: "node",

  // 프론트엔드(React 등)라면:
  // testEnvironment: "jsdom",

  // 테스트 파일 위치 패턴
  testMatch: ["**/tests/**/*.test.js"],

  // 테스트 실행 전 설정 파일
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // 커버리지 옵션
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/index.js" // 제외할 파일
  ]
};

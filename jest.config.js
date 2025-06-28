module.exports = {
    // Node.js 백엔드라면:

      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  detectOpenHandles:  true,
      testEnvironment: "node",
  
    // 프론트엔드(React 등)라면:
    // testEnvironment: "jsdom",
  
    // 테스트 파일 위치 패턴
    testMatch: ["**/tests/**/*.test.js"],
  
    // 커버리지 옵션
    collectCoverage: true,
    coverageDirectory: "coverage",
    collectCoverageFrom: [
      "controllers/**/*.js",
      "routes/**/*.js",
      "middlewares/**/*.js",
      "services/**/*.js",
      "config/**/*.js",
      "server.js",
      "!routes/**/index.js",
      "!config/**/index.js"
    ]
  };

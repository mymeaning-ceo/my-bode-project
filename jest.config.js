// jest.config.js
module.exports = {
    testEnvironment: "node",
    detectOpenHandles: true,
    forceExit: true,            // 열린 핸들이 남아도 강제 종료
  };
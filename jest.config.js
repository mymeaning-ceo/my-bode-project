// jest.config.js
module.exports = {
    testEnvironment: "node",
    detectOpenHandles: true,
    forceExit: true,
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};

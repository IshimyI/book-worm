module.exports = {
  setupFiles: ["<rootDir>/jest.setup.js"],
  // Route test files share one physical test DB and truncate tables
  // between cases — running suites in parallel workers races those
  // truncations against each other. Force sequential execution.
  maxWorkers: 1,
};

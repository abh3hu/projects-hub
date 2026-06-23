const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: ['e2e.test.js'],
  use: {
    baseURL: 'http://127.0.0.1:4010',
    headless: true
  },
  webServer: {
    command: 'SNAPSHOT_FILE=tests/fixtures/snapshot.json PORT=4010 node server.js',
    url: 'http://127.0.0.1:4010/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});

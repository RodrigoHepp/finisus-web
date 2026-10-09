import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './integracao-e2e',
  workers: 1,
  use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4200' },
  webServer: {
    command: 'npm start -- --host 127.0.0.1',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120000,
  },
});

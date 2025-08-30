// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30 * 1000,
    retries: 0,
    use: {
        baseURL: 'http://localhost:3001',
        browserName: 'chromium',
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        video: 'off',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npm run start:test',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 20 * 1000,
    },
    globalSetup: './globalSetup.js',
});

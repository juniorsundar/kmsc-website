import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', use: { baseURL: 'http://127.0.0.1:4321', launchOptions: process.env.CI ? {} : { executablePath: '/run/current-system/sw/bin/google-chrome' } }, webServer: { command: 'npm run build && npm run preview -- --host 127.0.0.1', port: 4321, reuseExistingServer: !process.env.CI }, reporter: 'line' });

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4174/encuesta-caba-pwa/',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-375', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, hasTouch: true } },
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  // Build aparte (dist-e2e) con los services reemplazados por tests/mocks (ver vite.config.ts):
  // ese bundle no contiene Firebase, así que no puede tocar el proyecto real ni pisa dist/.
  webServer: {
    command:
      'npx vite build --mode e2e --outDir dist-e2e --emptyOutDir && npx vite preview --mode e2e --outDir dist-e2e --port 4174 --strictPort',
    url: 'http://localhost:4174/encuesta-caba-pwa/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})

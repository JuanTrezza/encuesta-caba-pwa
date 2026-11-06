import { defineConfig } from '@playwright/test'

// Usa Playwright solo como runner, sin navegador. Se corre con npm run test:rules, que levanta el
// emulador de Firestore con el proyecto demo-voz-portena: los proyectos demo- no existen en Firebase.
export default defineConfig({
  testDir: './tests-rules',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
})

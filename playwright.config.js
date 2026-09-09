// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Runner do GitHub Actions tem bem menos CPU que uma máquina de dev — com
  // muitos workers em paralelo, testes longos (várias dezenas de cliques em
  // sequência, ex. "resolve as 15 frases") ocasionalmente estouram o timeout
  // de uma ação por pura falta de CPU, não por bug real (mesmo teste passa
  // sozinho na hora). `retries` reexecuta só o que falhou — um bug
  // determinístico continua falhando de novo, então não mascara nada.
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI,
  },
});

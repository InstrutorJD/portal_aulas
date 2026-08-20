// @ts-check
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

// Credenciais fake independentes das reais (shared/users-db.js não existe
// mais) — só precisam bater com o que auth.signInWithPassword do cliente
// fake espera (ver tests/fixtures/fake-supabase-client.js).
const SEED = {
  __authCredentials: [
    { id: 'u-breno', email: 'breno.silva80@aluno.portal.local', password: 'silva2026' },
    { id: 'u-alexandre', email: 'alexandre.natal@aluno.portal.local', password: 'natal2026' },
    { id: 'u-admin', email: 'admin@aluno.portal.local', password: 'jd4532' },
  ],
  profiles: [
    { id: 'u-breno', email: 'breno.silva80', nome: 'Breno Silva', role: 'aluno', turma: 'jogos' },
    { id: 'u-alexandre', email: 'alexandre.natal', nome: 'Alexandre Natal', role: 'aluno', turma: 'sistemas' },
    { id: 'u-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
};

async function login(page, user, pass) {
  await stubSupabaseFake(page, SEED);
  await page.goto('/index.html');
  await page.fill('#txtUser', user);
  await page.fill('#txtPass', pass);
  await page.click('.btn-submit');
}

test.describe('index.html — login', () => {
  test('credenciais inválidas mostram erro e não navegam', async ({ page }) => {
    await login(page, 'nao.existe', 'senhaerrada');
    await expect(page.locator('#errMsg')).toBeVisible();
    await expect(page).toHaveURL(/index\.html$/);
  });

  test('aluno de Jogos é redirecionado pra turmas/jogos/plataforma.html', async ({ page }) => {
    await login(page, 'breno.silva80', 'silva2026');
    await page.waitForURL(/turmas\/jogos\/plataforma\.html/);
  });

  test('aluno de Sistemas é redirecionado pra turmas/sistemas/plataforma.html', async ({ page }) => {
    await login(page, 'alexandre.natal', 'natal2026');
    await page.waitForURL(/turmas\/sistemas\/plataforma\.html/);
  });

  test('professor é redirecionado pro painel único', async ({ page }) => {
    await login(page, 'admin', 'jd4532');
    await page.waitForURL(/professor\/painel\.html/);
  });
});

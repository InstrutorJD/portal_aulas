// @ts-check
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const URL = '/professor/painel.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&name=Instrutor%20%2F%20Professor&turma=all';

test.describe('professor/painel.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('mostra só os dois cards de turma', async ({ page }) => {
    await page.goto(URL);

    await expect(page.locator('#sessionUser')).toHaveText('Instrutor / Professor');

    const cards = page.locator('.turma-card');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText('Jogos Digitais');
    await expect(cards.nth(1)).toContainText('Desenvolvimento de Sistemas');

    // não mistura mais alunos das duas turmas numa lista central
    await expect(page.locator('.app-container')).not.toContainText('Breno Silva');
    await expect(page.locator('.app-container')).not.toContainText('Alexandre Natal');
  });

  test('clicar num card abre o portal da respectiva turma', async ({ page }) => {
    await page.goto(URL);

    const [popupJogos] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('.turma-card', { hasText: 'Jogos Digitais' }).click(),
    ]);
    // A identidade agora vem da sessão (localStorage, compartilhada entre
    // abas do mesmo site) — o link não precisa mais carregar ?role=/?user=
    // na URL pra abrir o portal certo já autenticado como professor.
    await expect(popupJogos).toHaveURL(/turmas\/jogos\/plataforma\.html/);
    await popupJogos.close();

    const [popupSistemas] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('.turma-card', { hasText: 'Desenvolvimento de Sistemas' }).click(),
    ]);
    await expect(popupSistemas).toHaveURL(/turmas\/sistemas\/plataforma\.html/);
    await popupSistemas.close();
  });
});

// @ts-check
const { test, expect } = require('@playwright/test');
const { stubSupabaseDisabled } = require('./helpers');

const URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno';

test.describe('turmas/jogos/plataforma.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseDisabled(page);
  });

  test('carrega tema, usuário e trilhas JS/C#', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#txtUserNom')).toHaveText('Breno Silva');
    await expect(page.locator('#txtUserTurma')).toHaveText('Jogos Digitais');

    await expect(page.locator('.subtab-btn[data-subtab="js"]')).toHaveClass(/active/);
    await expect(page.locator('.subtab-btn[data-subtab="csharp"]')).toBeVisible();

    // tema "hacker": --green deve ser o verde original, não o azul de Sistemas
    const green = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--green').trim());
    expect(green).toBe('#7cff3f');
  });

  test('aba Jogos começa bloqueada quando os módulos não foram concluídos', async ({ page }) => {
    await page.goto(URL);
    const tabJogos = page.locator('#tabBtnJogos');
    await expect(tabJogos).toHaveClass(/disabled/);
    await expect(tabJogos).toContainText('🔒');
    await expect(page.locator('#lblGamesUnlock')).toHaveText(/BLOQUEADO/);

    // clicar numa aba bloqueada não deve abrir os jogos
    page.once('dialog', d => d.accept());
    await tabJogos.click();
    await expect(page.locator('#tabContentJogos')).toBeHidden();
  });

  test('abrir e fechar um módulo de trilha troca a área visível', async ({ page }) => {
    await page.goto(URL);
    await page.click('.subtab-btn[data-subtab="csharp"]');
    await expect(page.locator('#subTabContent_csharp')).toBeVisible();

    await page.click('#moduleSelector_csharp .game-card');
    await expect(page.locator('#moduleFrameArea_csharp')).toBeVisible();
    await expect(page.locator('#moduleSelector_csharp')).toBeHidden();
    await expect(page.locator('#moduleFrame_csharp')).toHaveAttribute(
      'src', /atividades\/csharp-basico\.html\?user=breno\.silva80/
    );

    await page.click('#moduleFrameArea_csharp .btn-secondary');
    await expect(page.locator('#moduleFrameArea_csharp')).toBeHidden();
    await expect(page.locator('#moduleSelector_csharp')).toBeVisible();
  });

  test('aba Jogos desbloqueia quando todos os módulos já foram concluídos', async ({ page }) => {
    await page.addInitScript(user => {
      localStorage.setItem(`js_basico_progress_${user}`, JSON.stringify([1, 2, 3, 4, 5]));
      localStorage.setItem(`js_intermediario_progress_${user}`, JSON.stringify([1, 2, 3, 4, 5, 6, 7]));
      localStorage.setItem(`csharp_basico_progress_${user}`, JSON.stringify({ completed: true }));
    }, 'breno.silva80');

    await page.goto(URL);
    const tabJogos = page.locator('#tabBtnJogos');
    await expect(tabJogos).not.toHaveClass(/disabled/);
    await expect(tabJogos).toContainText('🎮');
    await expect(page.locator('#lblGamesUnlock')).toHaveText('LIBERADO');

    await tabJogos.click();
    await expect(page.locator('#tabContentJogos')).toBeVisible();
    await expect(page.locator('#gameCardGrid .game-card')).toHaveCount(3);
  });
});

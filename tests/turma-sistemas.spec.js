// @ts-check
const { test, expect } = require('@playwright/test');
const { stubSupabaseDisabled } = require('./helpers');

const URL = '/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno';

test.describe('turmas/sistemas/plataforma.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseDisabled(page);
  });

  test('carrega com tema próprio, diferente do tema de Jogos', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#txtUserNom')).toHaveText('Alexandre Natal');
    await expect(page.locator('#txtUserTurma')).toHaveText('Sistemas');

    const green = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--green').trim());
    expect(green).toBe('#3aa0ff');
    expect(green).not.toBe('#7cff3f'); // não é o verde da turma Jogos
  });

  test('mostra a trilha SQL cadastrada pra essa turma, com teoria e prática', async ({ page }) => {
    await page.goto(URL);
    // Só 1 trilha nessa turma — nenhum seletor de trilha aparece, o conteúdo já vem direto.
    await expect(page.locator('#trilhaSelect')).toHaveCount(0);
    await expect(page.locator('#moduleSelector_sql')).toBeVisible();
    await expect(page.locator('#moduleSelector_sql')).toContainText('Teoria — Fundamentos de SQL');
    await expect(page.locator('#moduleSelector_sql')).toContainText('Prática — Central de Dados');
  });

  test('prática do SQL fica bloqueada até a teoria ser concluída', async ({ page }) => {
    await page.goto(URL);
    const praticaCard = page.locator('#moduleSelector_sql .game-card', { hasText: 'Prática — Central de Dados' });
    await expect(praticaCard).toHaveClass(/locked/);
    await expect(praticaCard).toContainText('Bloqueado');
  });

  test('jogos ficam bloqueados até completar a trilha SQL', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#tabBtnJogos')).toHaveClass(/disabled/);
    await expect(page.locator('#lblGamesUnlock')).toHaveText(/BLOQUEADO/);
  });
});

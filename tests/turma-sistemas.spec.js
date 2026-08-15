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

  test('mostra estado vazio (sem trilhas cadastradas ainda)', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#aulasSubTabPages .empty-state')).toContainText('Nenhuma trilha cadastrada');
    // sem subtabs de trilha nenhuma renderizada
    await expect(page.locator('.subtab-btn')).toHaveCount(0);
  });

  test('jogos continuam bloqueados por padrão (sem trilha pra completar)', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#tabBtnJogos')).toHaveClass(/disabled/);
    await expect(page.locator('#lblGamesUnlock')).toHaveText(/BLOQUEADO/);
  });
});

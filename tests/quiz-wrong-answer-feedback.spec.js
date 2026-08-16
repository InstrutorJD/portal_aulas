// @ts-check
// Regressão: no quiz de teoria (história + pergunta), a explicação de cada
// pergunta é escrita assumindo que o aluno acertou (começa com "Isso!",
// "Correto!", "Exato!" etc.). Quando o aluno erra, o código prefixava essa
// mesma explicação com "❌ Não foi dessa vez.", resultando numa mensagem
// contraditória tipo "Não foi dessa vez. Isso! ..." — confuso pro aluno.
// A correção remove essa afirmação redundante da mensagem de erro e deixa
// explícito qual era a resposta certa.
const { test, expect } = require('@playwright/test');
const { stubSupabaseDisabled } = require('./helpers');

const URL = '/turmas/sistemas/atividades/sql-basico-teoria.html?user=alexandre.natal&role=aluno';

test.describe('Feedback de resposta errada no quiz de teoria', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseDisabled(page);
  });

  test('mensagem de erro não repete a afirmação de acerto embutida na explicação', async ({ page }) => {
    await page.goto(URL);
    await page.click('#btnNext');

    // Etapa 1: resposta certa é a opção 0 ("Tabelas"); clica na errada (índice 1).
    await page.locator('.option').nth(1).click();

    const feedback = page.locator('.feedback.incorrect');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText('Não foi dessa vez');
    await expect(feedback).toContainText('A resposta certa é');
    await expect(feedback).toContainText('Tabelas');

    // A afirmação de acerto ("Isso!", "Correto!" etc.) não deve aparecer
    // colada logo após "Não foi dessa vez." — sinal do bug de mistura.
    const text = await feedback.textContent();
    expect(text).not.toMatch(/Não foi dessa vez\.\s*(Isso mesmo!|Isso!|Correto!|Exato!|Perfeito!|Correta!)/);
  });

  test('mensagem de acerto continua normal (não afetada pela correção)', async ({ page }) => {
    await page.goto(URL);
    await page.click('#btnNext');

    await page.locator('.option').nth(0).click();

    const feedback = page.locator('.feedback.correct');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText('✅ Correto!');
  });
});

// @ts-check
// Botão flutuante "📋 Gerar Gabarito" (shared/gabarito-generator.js) —
// some sozinho, sem precisar de nenhum elemento HTML por atividade, em
// qualquer atividade (teórica ou prática) que defina
// window.generateGabaritoForGestao, só pro professor/admin. Substitui a
// necessidade de abrir a Gestão pra gerar o gabarito de uma atividade só —
// mesma ideia do "Gerar Slides" que já existia (btnGenSlides, só em aulas
// teóricas), só que centralizado num arquivo só e cobrindo prática também.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const PROFESSOR_PROFILE = { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' };

test.describe('Botão flutuante de Gabarito (dentro da atividade)', () => {
  test('aparece pro professor numa aula TEÓRICA e gera o .txt ao clicar', async ({ page }) => {
    await stubSupabaseFake(page, { profiles: [PROFESSOR_PROFILE] });
    await page.goto('/turmas/sistemas/atividades/vida-autoconhecimento-teoria.html?user=admin&role=professor&turma=sistemas');

    const btn = page.locator('#btnGenGabaritoFloat');
    await expect(btn).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      btn.click(),
    ]);
    expect(download.suggestedFilename()).toBe('vida-autoconhecimento-teoria-gabarito.txt');
  });

  test('aparece pro professor numa atividade PRÁTICA e gera o .txt ao clicar', async ({ page }) => {
    await stubSupabaseFake(page, { profiles: [PROFESSOR_PROFILE] });
    await page.goto('/turmas/sistemas/atividades/prog-depuracao-pratica.html?user=admin&role=professor&turma=sistemas');

    const btn = page.locator('#btnGenGabaritoFloat');
    await expect(btn).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      btn.click(),
    ]);
    expect(download.suggestedFilename()).toBe('prog-depuracao-pratica-gabarito.txt');
  });

  test('não aparece pro aluno', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/sistemas/atividades/vida-autoconhecimento-teoria.html?user=alexandre.natal&role=aluno&turma=sistemas');
    await expect(page.locator('#btnGenGabaritoFloat')).toHaveCount(0);
  });
});

// @ts-check
// Regressão: PENDENCIAS.md, "Desbloquear todas as etapas das atividades
// para o professor" — o professor precisa conseguir abrir/navegar
// livremente por qualquer desafio de código de verdade (CHALLENGES/STEPS
// com progressão trancada: resolver o anterior destrava o próximo), sem
// precisar "resolver" nada em ordem, pra poder revisar/demonstrar/testar
// qualquer parte do conteúdo. Cobre as 3 variações da correção aplicada em
// lote:
//   - Padrão bespoke comum (isUnlocked(challenge) sobre CHALLENGES,
//     ~48 arquivos — js-basico.html como amostra).
//   - Motor compartilhado shared/js-challenge-engine.js (usado por
//     js-fundamentos-basico.html/-intermediario.html).
//   - Caso especial cobrinha-construcao.html: isUnlocked(index) sobre
//     STEPS + vistoUnlocked (passo final) calculado à parte.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const PROFESSOR_SEED = {
  profiles: [
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
};

test.describe('Professor vê todos os desafios de código destravados', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, PROFESSOR_SEED);
  });

  test('padrão bespoke (js-basico.html): nenhum item com cadeado, dá pra abrir o último direto', async ({ page }) => {
    await page.goto('/turmas/jogos/atividades/js-basico.html?user=admin&turma=jogos');
    await expect(page.locator('.challenge-item')).not.toHaveCount(0);
    await expect(page.locator('.challenge-item.locked')).toHaveCount(0);

    await page.locator('.challenge-item').last().click();
    await expect(page.locator('#challengeTitle')).not.toHaveText('--');
  });

  test('motor compartilhado (js-fundamentos-basico.html): nenhum item com cadeado', async ({ page }) => {
    await page.goto('/turmas/sistemas/atividades/js-fundamentos-basico.html?user=admin&turma=sistemas');
    await expect(page.locator('.challenge-item')).not.toHaveCount(0);
    await expect(page.locator('.challenge-item.locked')).toHaveCount(0);
  });

  test('cobrinha-construcao.html: todos os passos E o Visto do professor destravados', async ({ page }) => {
    await page.goto('/turmas/jogos/atividades/cobrinha-construcao.html?user=admin');
    await expect(page.locator('.step-item')).not.toHaveCount(0);
    await expect(page.locator('.step-item.locked')).toHaveCount(0);

    // Último item da sidebar é o "Visto do professor" — normalmente só
    // destrava com STEPS.every(completo). Clica nele direto, sem ter
    // resolvido nenhum passo.
    await page.locator('.step-item').last().click();
    await expect(page.locator('#stepContent')).toContainText('Visto');
  });
});

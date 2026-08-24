// @ts-check
// Regressão: no quiz de teoria (história + pergunta), errar uma pergunta NÃO
// pode revelar qual era a opção certa — nem no texto do feedback, nem
// destacando visualmente a opção certa. Antes disso ser corrigido, a
// mensagem de erro escrevia `A resposta certa é "<b>...</b>"` e a opção
// certa ganhava a classe `.correct` mesmo sem o aluno ter clicado nela — o
// aluno via a resposta e, ao reiniciar a atividade (mesmo banco de
// perguntas, só a ordem embaralha), simplesmente marcava o que já sabia ser
// certo, sem precisar ter aprendido nada (ver shared/quiz-teoria-engine.js).
//
// A ordem de exibição das opções (A/B/C/D) é embaralhada a cada renderização
// da pergunta (ver renderQuestion() em shared/quiz-teoria-engine.js), então os
// testes não podem assumir que um índice fixo é sempre certo/errado. Em vez
// disso, recarregam a página e clicam sempre na opção 0 até bater no
// resultado desejado — como cada recarga sorteia uma ordem nova e
// independente, isso converge rápido sem depender de nenhum detalhe interno
// do algoritmo de embaralhamento.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const URL = '/turmas/sistemas/atividades/sql-basico-teoria.html?user=alexandre.natal&role=aluno';
const MAX_ATTEMPTS = 40;

async function answerFirstQuestion(page) {
  await page.goto(URL);
  await page.click('#btnNext');
  await page.locator('.option').first().click();

  const incorrect = page.locator('.feedback.incorrect');
  if (await incorrect.count()) return { kind: 'incorrect', locator: incorrect };

  const correct = page.locator('.feedback.correct');
  await expect(correct).toBeVisible();
  return { kind: 'correct', locator: correct };
}

async function answerUntil(page, wantedKind) {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const result = await answerFirstQuestion(page);
    if (result.kind === wantedKind) return result.locator;
  }
  return null;
}

test.describe('Feedback de resposta errada no quiz de teoria', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('mensagem de erro não revela qual era a resposta certa', async ({ page }) => {
    const feedback = await answerUntil(page, 'incorrect');
    expect(feedback, `nenhuma resposta errada em ${MAX_ATTEMPTS} tentativas — algo mudou na estrutura da pergunta`).not.toBeNull();

    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText('Não foi dessa vez');
    await expect(feedback).not.toContainText('A resposta certa é');

    // Nenhuma opção deve ficar marcada como certa quando o aluno errou —
    // só a que ele escolheu, como incorreta.
    await expect(page.locator('.option.correct')).toHaveCount(0);
    await expect(page.locator('.option.incorrect')).toHaveCount(1);
  });

  test('mensagem de acerto continua normal (não afetada pela correção)', async ({ page }) => {
    const feedback = await answerUntil(page, 'correct');
    expect(feedback, `nenhuma resposta certa em ${MAX_ATTEMPTS} tentativas — algo mudou na estrutura da pergunta`).not.toBeNull();

    await expect(feedback).toContainText('✅ Correto!');
  });
});

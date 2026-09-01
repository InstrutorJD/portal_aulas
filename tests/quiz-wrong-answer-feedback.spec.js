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
// da pergunta (ver renderQuestion() em shared/quiz-teoria-engine.js), então o
// teste não pode assumir que um índice fixo é sempre certo/errado. Em vez de
// recarregar a página repetidas vezes até calhar de errar/acertar (o que
// dependia do furo corrigido em tests/quiz-retry-lockout.spec.js — recarregar
// não repete mais a mesma pergunta), lê a resposta certa da PRÓPRIA pergunta
// atual (STEPS[stepOrder[currentStepIndex]], globais expostos por
// shared/quiz-teoria-engine.js) e clica deliberadamente na opção certa ou
// errada pelo texto — mesma técnica de tests/quiz-80-percent-threshold.spec.js.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const URL = '/turmas/sistemas/atividades/sql-basico-teoria.html?user=alexandre.natal&role=aluno';

async function answerCurrentQuestion(page, correct) {
  const correctText = await page.evaluate(() => {
    const q = STEPS[stepOrder[currentStepIndex]].question;
    return q.options[q.correctIndex];
  });
  const options = page.locator('.option');
  const count = await options.count();
  let idx = -1;
  for (let j = 0; j < count; j++) {
    const text = await options.nth(j).innerText();
    const isMatch = text.includes(correctText);
    if (correct ? isMatch : !isMatch) { idx = j; break; }
  }
  await options.nth(idx).click();
}

test.describe('Feedback de resposta errada no quiz de teoria', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('mensagem de erro não revela qual era a resposta certa', async ({ page }) => {
    await page.goto(URL);
    await page.click('#btnNext');
    await answerCurrentQuestion(page, false);

    const feedback = page.locator('.feedback.incorrect');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText('Não foi dessa vez');
    await expect(feedback).not.toContainText('A resposta certa é');

    // Nenhuma opção deve ficar marcada como certa quando o aluno errou —
    // só a que ele escolheu, como incorreta.
    await expect(page.locator('.option.correct')).toHaveCount(0);
    await expect(page.locator('.option.incorrect')).toHaveCount(1);
  });

  test('mensagem de acerto continua normal (não afetada pela correção)', async ({ page }) => {
    await page.goto(URL);
    await page.click('#btnNext');
    await answerCurrentQuestion(page, true);

    await expect(page.locator('.feedback.correct')).toContainText('✅ Correto!');
  });
});

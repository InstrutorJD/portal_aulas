// @ts-check
// Corrige o furo que deixava "responder até acertar": recarregar a página
// depois de responder (certo OU errado), mas antes de clicar em "Próximo",
// resumia na MESMA pergunta — dava pra tentar de novo à vontade. O mesmo
// furo deixava correctCount passar de steps.length (respondendo a MESMA
// pergunta certa repetidas vezes recarregando logo depois de acertar),
// estourando o % final acima de 100 (ver shared/quiz-teoria-engine.js).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const URL = '/turmas/sistemas/atividades/sql-comentarios-teoria.html?user=alexandre.natal&role=aluno&turma=sistemas';
const PROGRESS_KEY = 'sql_comentarios_teoria_progress_alexandre.natal';

async function currentPrompt(page) {
  return page.evaluate(() => STEPS[stepOrder[currentStepIndex]].question.prompt);
}

// Mesma técnica de tests/quiz-80-percent-threshold.spec.js: acha a opção
// certa/errada pelo TEXTO (a ordem A/B/C/D embaralha a cada renderização).
async function answerCurrent(page, correct) {
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

test.describe('Quiz de teoria — recarregar não deixa refazer a mesma pergunta', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('errou e recarregou antes de "Próximo": pula pra próxima pergunta, sem chance de refazer', async ({ page }) => {
    await page.goto(URL);
    await page.click('#btnNext');
    const firstPrompt = await currentPrompt(page);
    await answerCurrent(page, false);
    await expect(page.locator('.feedback.incorrect')).toBeVisible();

    const beforeReload = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PROGRESS_KEY);
    expect(beforeReload.correctCount).toBe(0);

    // Recarrega SEM clicar em "Próximo" — antes da correção, isso voltava
    // pra mesma pergunta (dando outra chance de acertar).
    await page.goto(URL);
    await page.click('#btnNext');
    const secondPrompt = await currentPrompt(page);
    expect(secondPrompt, 'recarregar depois de errar voltou pra MESMA pergunta').not.toBe(firstPrompt);
  });

  test('acertou e recarregou antes de "Próximo": não deixa responder de novo (evita inflar o placar)', async ({ page }) => {
    await page.goto(URL);
    await page.click('#btnNext');
    const firstPrompt = await currentPrompt(page);
    await answerCurrent(page, true);
    await expect(page.locator('.feedback.correct')).toBeVisible();

    const beforeReload = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PROGRESS_KEY);
    expect(beforeReload.correctCount).toBe(1);

    await page.goto(URL);
    await page.click('#btnNext');
    const secondPrompt = await currentPrompt(page);
    expect(secondPrompt, 'recarregar depois de acertar voltou pra MESMA pergunta (dava pra acertar de novo e inflar o placar)').not.toBe(firstPrompt);

    const afterReload = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PROGRESS_KEY);
    expect(afterReload.correctCount).toBe(1);
  });

  test('saiu no meio de uma pergunta (sem responder) e voltou: continua na MESMA pergunta', async ({ page }) => {
    await page.goto(URL);
    await page.click('#btnNext');
    await answerCurrent(page, true);
    await page.click('#btnNextAfterAnswer');
    await page.click('#btnNext'); // entra na 2ª pergunta, sem responder ainda
    const prompt = await currentPrompt(page);

    await page.goto(URL);
    await page.click('#btnNext');
    const promptAfterReload = await currentPrompt(page);
    expect(promptAfterReload).toBe(prompt);
  });

  test('placar nunca passa de 100%, mesmo com correctCount corrompido no localStorage', async ({ page }) => {
    await page.addInitScript(([key]) => {
      localStorage.setItem(key, JSON.stringify({ lastStepIndex: 9, correctCount: 15, completed: false, answered: true }));
    }, [PROGRESS_KEY]);
    await page.goto(URL);
    // lastStepIndex já no fim (9 perguntas) + answered:true -> resumeIndex
    // estoura steps.length -> a própria carga já fecha a jornada.
    await expect(page.locator('.finish-screen')).toBeVisible();
    await expect(page.locator('.finish-screen')).toContainText('(100%)');
  });
});

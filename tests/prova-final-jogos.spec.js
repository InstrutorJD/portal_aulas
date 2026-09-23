// @ts-check
// "Prova Final — Turma Jogos Digitais" (matéria Prova, trilha Prova Final):
// atividade SEPARADA da Prova Diagnóstica (prova-jogos.spec.js) — banco
// de 80 questões (72 teóricas de múltipla escolha + 8 práticas, onde o
// aluno ESCREVE código de verdade num editor Monaco e o motor roda num
// sandbox), sorteando 25 por aluno (sempre pelo menos 5 práticas, nunca por
// acaso — ver pickExamIndices()). Mesma trava de integridade (shared/
// exam-proctor.js) e mesmo token de desbloqueio (shared/professor-visto.js)
// da Prova Diagnóstica. Mesmo mecanismo já usado pela turma Sistemas (ver
// tests/prova-final-sistemas.spec.js).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, gerarGabaritoFlutuante } = require('./helpers');

const PROVA_URL = '/turmas/jogos/atividades/prova-final-jogos.html?user=breno.silva80&role=aluno&turma=jogos';

const TOKEN_VALIDO = '482913';

const SEED = {
  profiles: [
    { id: 'fake-breno.silva80', email: 'breno.silva80', nome: 'Breno Silva', role: 'aluno', turma: 'jogos' },
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
  professor_tokens: [
    { token: TOKEN_VALIDO, created_by: 'fake-admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  ],
};

/** Mesma técnica de tests/modelagem-dados-requisitos.spec.js: document.hidden
 * é só-leitura, então redefine a propriedade antes de disparar o evento que
 * shared/exam-proctor.js escuta — Playwright não troca de aba de verdade. */
async function simulateTabHidden(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

/** A questão atual pode ser teórica (múltipla escolha) ou prática (editor
 * de código) — o sorteio embaralha as duas. Responde da forma mais simples
 * possível (1ª alternativa / confirma sem digitar nada) só pra AVANÇAR,
 * sem se importar em acertar. */
async function answerCurrentQuestionSomehow(page) {
  const isPratica = await page.locator('.code-editor').count() > 0;
  if (isPratica) {
    await expect(page.locator('#btnConfirmarPratica')).toBeEnabled({ timeout: 15000 });
    await page.click('#btnConfirmarPratica');
  } else {
    await page.locator('.option').first().click();
  }
  const isLast = (await page.locator('button:has-text("Ver resultado")').count()) > 0;
  await page.click(isLast ? 'button:has-text("Ver resultado")' : '#btnNextAfterAnswer');
}

test.describe('turmas/jogos/atividades/prova-final-jogos.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('mostra a tela de regras antes de iniciar, mencionando teoria e prática', async ({ page }) => {
    await page.goto(PROVA_URL);
    await expect(page.locator('#gateWrap')).toContainText('Prova Final — Turma Jogos Digitais');
    await expect(page.locator('#gateWrap')).toContainText('80 questões');
    await expect(page.locator('#gateWrap')).toContainText('25');
    await expect(page.locator('#gateWrap')).toContainText('pelo menos');
    await expect(page.locator('#gateWrap')).toContainText('5 são práticas');
    await expect(page.locator('#storyWrap')).toBeHidden();
    await expect(page.locator('#btnIniciar')).toBeVisible();
  });

  test('toda tentativa sorteia pelo menos 5 questões práticas em 25', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');

    let praticaCount = 0;
    for (let i = 0; i < 25; i++) {
      const isPratica = await page.locator('.code-editor').count() > 0;
      if (isPratica) praticaCount++;
      await answerCurrentQuestionSomehow(page);
    }

    expect(praticaCount).toBeGreaterThanOrEqual(5);
    await expect(page.locator('.finish-screen .score')).toContainText('de 100 pontos');
  });

  test('questão teórica vem com exatamente 5 alternativas', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');

    // Avança até cair numa teórica, caso a 1ª sorteada seja prática.
    for (let i = 0; i < 25 && (await page.locator('.option').count()) === 0; i++) {
      await answerCurrentQuestionSomehow(page);
    }
    await expect(page.locator('.option')).toHaveCount(5);
    await expect(page.locator('.opt-letter').nth(4)).toHaveText('E');
  });

  test('questão teórica: feedback diz explicitamente se acertou ou errou (não só "Resposta registrada")', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');

    for (let i = 0; i < 25 && (await page.locator('.option').count()) === 0; i++) {
      await answerCurrentQuestionSomehow(page);
    }
    await expect(page.locator('.option')).toHaveCount(5);

    await page.locator('.option').first().click();
    const acertou = (await page.locator('.feedback.correct').count()) > 0;
    await expect(page.locator('.feedback')).toContainText(acertou ? 'Você acertou' : 'Você errou');
  });

  test('questão prática: escrever o código certo e confirmar conta como acerto', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');

    // Avança até cair numa prática (garantido existir ao menos 1 em 25).
    for (let i = 0; i < 25 && (await page.locator('.code-editor').count()) === 0; i++) {
      await answerCurrentQuestionSomehow(page);
    }
    await expect(page.locator('.code-editor')).toHaveCount(1);
    await expect(page.locator('#btnConfirmarPratica')).toBeEnabled({ timeout: 15000 });

    // Digita a SOLUÇÃO de verdade da questão prática atual, lida direto do
    // banco de questões da própria página (window global, ver boot()).
    await page.evaluate(() => {
      const q = QUESTION_POOL[selection[currentIndex]];
      activeCodeEditor.setValue(q.solution);
    });
    await page.click('#btnExecutarPratica');
    // Executar mostra a saída real do código, mas nunca revela se bateu com
    // o esperado (é uma prova, não uma prática de treino).
    await expect(page.locator('.console .line.fail')).toHaveCount(0);

    await page.click('#btnConfirmarPratica');
    await expect(page.locator('.feedback.correct')).toContainText('Você acertou');
    await expect(page.locator('#btnExecutarPratica')).toBeDisabled();
    await expect(page.locator('#btnConfirmarPratica')).toBeDisabled();
  });

  test('questão prática: confirmar sem escrever nada conta como erro', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');

    for (let i = 0; i < 25 && (await page.locator('.code-editor').count()) === 0; i++) {
      await answerCurrentQuestionSomehow(page);
    }
    await expect(page.locator('.code-editor')).toHaveCount(1);
    await expect(page.locator('#btnConfirmarPratica')).toBeEnabled({ timeout: 15000 });

    await page.click('#btnConfirmarPratica');
    await expect(page.locator('.feedback.incorrect')).toContainText('Você errou');
  });

  test('responde as 25 questões e conclui, sem opção de tentar de novo', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');

    for (let i = 0; i < 25; i++) {
      await expect(page.locator('#lblStepNum')).toHaveText(String(i + 1));
      await answerCurrentQuestionSomehow(page);
    }

    await expect(page.locator('.finish-screen h2')).toContainText('Prova Final concluída');
    await expect(page.locator('.finish-screen')).toContainText('de 25 questões');
    await expect(page.locator('.finish-screen .score')).toContainText('de 100 pontos');
    await expect(page.locator('button:has-text("tentar")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Tentar")')).toHaveCount(0);

    const stored = await page.evaluate(u => JSON.parse(localStorage.getItem(`prova_final_jogos_progress_${u}`)), 'breno.silva80');
    expect(stored.completed).toBe(true);
    expect(stored.total).toBe(25);
    expect(typeof stored.correctCount).toBe('number');
    // Prova vale 100 pontos, 4 por questão (100/25) — a nota é sempre um
    // múltiplo de 4, nunca um percentual (ver finishExam()).
    expect(stored.nota).toBe(stored.correctCount * 4);
    expect(stored.nota).toBeGreaterThanOrEqual(0);
    expect(stored.nota).toBeLessThanOrEqual(100);
    await expect(page.locator('.finish-screen .score')).toContainText(`Nota: ${stored.nota} de 100 pontos`);

    // Recarregar depois de concluída mostra o resultado final de novo, não a prova.
    await page.reload();
    await expect(page.locator('.finish-screen h2')).toContainText('Prova Final concluída');
    await expect(page.locator('.finish-screen .score')).toContainText(`Nota: ${stored.nota} de 100 pontos`);
  });

  test('pular uma questão (teórica ou prática) marca como perdida, sem chance de responder de novo', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');

    await page.click('#btnPularQuestao');
    await expect(page.locator('.feedback')).toContainText('Questão pulada');
    await expect(page.locator('#btnPularQuestao')).toHaveCount(0);
    await page.click(await page.locator('button:has-text("Ver resultado")').count() ? 'button:has-text("Ver resultado")' : '#btnNextAfterAnswer');
    await expect(page.locator('#lblStepNum')).toHaveText('2');

    // Recarregar não deve voltar pra questão pulada.
    await page.reload();
    await expect(page.locator('#lblStepNum')).toHaveText('2');
  });

  test('1ª saída da aba avisa, 2ª bloqueia — e o professor desbloqueia com o token RETOMANDO a mesma tentativa', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');

    // Responde a 1ª questão antes de sair, pra confirmar depois que o
    // desbloqueio não jogou fora esse progresso (não voltou pra tela de
    // regras, que sortearia 25 questões novas do zero).
    await answerCurrentQuestionSomehow(page);
    const selectionBefore = await page.evaluate(u => localStorage.getItem(`prova_final_jogos_selecao_${u}`), 'breno.silva80');

    await simulateTabHidden(page);
    await expect(page.locator('.warn-overlay')).toContainText('Advertência 1/2');
    await page.click('#btnWarnOk');
    await expect(page.locator('.warn-overlay')).toHaveCount(0);

    await simulateTabHidden(page);
    await expect(page.locator('#gateWrap')).toContainText('Prova bloqueada');
    await expect(page.locator('#storyWrap')).toBeHidden();

    await page.fill('#unlockToken', '000000');
    await page.click('#btnUnlock');
    await expect(page.locator('#gateWrap')).toContainText('Prova bloqueada');

    await page.fill('#unlockToken', TOKEN_VALIDO);
    await page.click('#btnUnlock');
    // Desbloqueou, mas o sorteio já tinha sido feito — volta direto pra
    // prova, na 2ª questão (não reinicia a tentativa do zero na tela de regras).
    await expect(page.locator('#storyWrap')).toBeVisible();
    await expect(page.locator('#gateWrap')).toBeHidden();
    await expect(page.locator('#lblStepNum')).toHaveText('2');

    const selectionAfter = await page.evaluate(u => localStorage.getItem(`prova_final_jogos_selecao_${u}`), 'breno.silva80');
    expect(selectionAfter).toBe(selectionBefore);
  });

  test('professor tem um botão "Reiniciar prova" pra testar o sorteio de novo', async ({ page }) => {
    const PROF_URL = '/turmas/jogos/atividades/prova-final-jogos.html?user=admin&role=professor&turma=jogos';
    await page.goto(PROF_URL);
    // Professor não passa pela trava nem pela tela de regras (guard.disabled) —
    // cai direto numa questão, com uma seleção já sorteada automaticamente.
    await expect(page.locator('#btnResetProfessor')).toBeVisible();
    await expect(page.locator('#btnSkipProfessor')).toBeVisible();

    const selectionBefore = await page.evaluate(u => localStorage.getItem(`prova_final_jogos_selecao_${u}`), 'admin');
    expect(selectionBefore).not.toBeNull();

    await page.click('#btnResetProfessor');

    const selectionAfter = await page.evaluate(u => localStorage.getItem(`prova_final_jogos_selecao_${u}`), 'admin');
    expect(selectionAfter).not.toBeNull();
    // Praticamente impossível o sorteio de 25 de 80 repetir por acaso —
    // confirma que reiniciar de fato gerou uma seleção nova.
    expect(selectionAfter).not.toBe(selectionBefore);
  });

  test('gabarito lista o banco inteiro de 80 questões', async ({ page }) => {
    await page.goto('/turmas/jogos/atividades/prova-final-jogos.html?user=admin&role=professor&turma=jogos');

    const download = await gerarGabaritoFlutuante(page);
    expect(download.suggestedFilename()).toBe('prova-final-jogos-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('80)');
    expect(content).not.toContain('81)');
    expect(content).toContain('[Prática]');
  });
});

test.describe('turmas/jogos/plataforma.html — matéria Prova', () => {
  test('aparece a trilha Prova Final, separada da Prova Diagnóstica', async ({ page }) => {
    await stubSupabaseFake(page, SEED);
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Prova")');
    await page.selectOption('#trilhaSelect', 'prova-final');
    await expect(page.locator('#moduleSelector_prova-final')).toContainText('Prova Final — Turma Jogos Digitais');
  });
});

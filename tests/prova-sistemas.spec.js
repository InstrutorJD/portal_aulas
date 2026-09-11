// @ts-check
// "Prova — Turma Sistemas" (matéria Prova, trilha Prova Diagnóstica):
// diagnóstico cobrindo todas as matérias da turma. Banco de 78 questões (5
// alternativas cada), sorteando 20 por aluno na primeira vez que ele clica
// "Iniciar prova" — o sorteio fica travado (localStorage) pelo resto da
// tentativa. Trava de integridade (shared/exam-proctor.js), mesmo padrão de
// modelagem-dados-requisitos-questionario.html: 1ª saída da aba avisa, 2ª
// bloqueia até o professor liberar com token. Sem "tentar de novo": uma
// única tentativa oficial, a pontuação final fica registrada pro professor.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, gerarGabaritoFlutuante } = require('./helpers');

const PROVA_URL = '/turmas/sistemas/atividades/prova-sistemas.html?user=alexandre.natal&role=aluno&turma=sistemas';

const TOKEN_VALIDO = '482913';

const SEED = {
  profiles: [
    { id: 'fake-alexandre.natal', email: 'alexandre.natal', nome: 'Alexandre Natal', role: 'aluno', turma: 'sistemas' },
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

async function answerCurrentQuestion(page) {
  await page.locator('.option').first().click();
  await page.click('#btnNextAfterAnswer');
}

test.describe('turmas/sistemas/atividades/prova-sistemas.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('mostra a tela de regras antes de iniciar, não a prova direto', async ({ page }) => {
    await page.goto(PROVA_URL);
    await expect(page.locator('#gateWrap')).toContainText('Prova Diagnóstica — Turma Sistemas');
    await expect(page.locator('#gateWrap')).toContainText('78 questões');
    await expect(page.locator('#gateWrap')).toContainText('20');
    await expect(page.locator('#storyWrap')).toBeHidden();
    await expect(page.locator('#btnIniciar')).toBeVisible();
  });

  test('cada questão vem com exatamente 5 alternativas', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');
    await expect(page.locator('.option')).toHaveCount(5);
    await expect(page.locator('.opt-letter').nth(4)).toHaveText('E');
  });

  test('recarregar a página no meio da prova mantém o mesmo sorteio de 20 questões (não sorteia de novo)', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');
    await expect(page.locator('.option')).toHaveCount(5);

    const selectionBefore = await page.evaluate(u => localStorage.getItem(`prova_sistemas_selecao_${u}`), 'alexandre.natal');
    expect(selectionBefore).not.toBeNull();

    await page.reload();
    // Recarregar não deve voltar pra tela de regras — deve continuar direto na prova.
    await expect(page.locator('#storyWrap')).toBeVisible();
    await expect(page.locator('.option')).toHaveCount(5);

    const selectionAfter = await page.evaluate(u => localStorage.getItem(`prova_sistemas_selecao_${u}`), 'alexandre.natal');
    expect(selectionAfter).toBe(selectionBefore);
  });

  test('responde as 20 questões e conclui, sem opção de tentar de novo', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');

    for (let i = 0; i < 20; i++) {
      await expect(page.locator('#lblStepNum')).toHaveText(String(i + 1));
      await answerCurrentQuestion(page);
    }

    await expect(page.locator('.finish-screen h2')).toContainText('Prova concluída');
    await expect(page.locator('.finish-screen')).toContainText('de 20 questões');
    await expect(page.locator('.finish-screen .score')).toContainText('de 100 pontos');
    await expect(page.locator('button:has-text("tentar")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Tentar")')).toHaveCount(0);

    const stored = await page.evaluate(u => JSON.parse(localStorage.getItem(`prova_sistemas_progress_${u}`)), 'alexandre.natal');
    expect(stored.completed).toBe(true);
    expect(stored.total).toBe(20);
    expect(typeof stored.correctCount).toBe('number');
    // Prova vale 100 pontos, 5 por questão (100/20) — a nota é sempre um
    // múltiplo de 5, nunca um percentual (ver finishExam()).
    expect(stored.nota).toBe(stored.correctCount * 5);
    expect(stored.nota).toBeGreaterThanOrEqual(0);
    expect(stored.nota).toBeLessThanOrEqual(100);
    await expect(page.locator('.finish-screen .score')).toContainText(`Nota: ${stored.nota} de 100 pontos`);

    // Recarregar depois de concluída mostra o resultado final de novo, não a prova.
    await page.reload();
    await expect(page.locator('.finish-screen h2')).toContainText('Prova concluída');
    await expect(page.locator('.finish-screen .score')).toContainText(`Nota: ${stored.nota} de 100 pontos`);
  });

  test('pular uma questão marca como perdida — não conta como acerto, e não dá pra responder de novo depois', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');
    await expect(page.locator('.option')).toHaveCount(5);

    await page.click('#btnPularQuestao');
    await expect(page.locator('.feedback')).toContainText('Questão pulada');
    await expect(page.locator('.option.disabled')).toHaveCount(5);
    await expect(page.locator('#btnPularQuestao')).toHaveCount(0);
    await page.click('#btnNextAfterAnswer');
    await expect(page.locator('#lblStepNum')).toHaveText('2');

    // Recarregar não deve voltar pra questão pulada — o motor trata "pulada"
    // igual a "respondida" (mesma trava anti-repetição).
    await page.reload();
    await expect(page.locator('#lblStepNum')).toHaveText('2');

    // Pula as 19 restantes também, pra provar que nenhum pulo soma ponto.
    for (let i = 1; i < 20; i++) {
      await page.click('#btnPularQuestao');
      await page.click('#btnNextAfterAnswer');
    }

    await expect(page.locator('.finish-screen .score')).toContainText('Nota: 0 de 100 pontos');
    const stored = await page.evaluate(u => JSON.parse(localStorage.getItem(`prova_sistemas_progress_${u}`)), 'alexandre.natal');
    expect(stored.correctCount).toBe(0);
    expect(stored.nota).toBe(0);
  });

  test('1ª saída da aba avisa, 2ª bloqueia — e o professor desbloqueia com o token', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnIniciar');
    await expect(page.locator('.option')).toHaveCount(5);

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
    // prova (não pra tela de regras), sem perder o que já foi respondido.
    await expect(page.locator('.option')).toHaveCount(5);
  });

  test('professor tem um botão "Reiniciar prova" pra testar o sorteio de novo', async ({ page }) => {
    const PROF_URL = '/turmas/sistemas/atividades/prova-sistemas.html?user=admin&role=professor&turma=sistemas';
    await page.goto(PROF_URL);
    // Professor não passa pela trava nem pela tela de regras (guard.disabled) —
    // cai direto numa questão, com uma seleção já sorteada automaticamente.
    await expect(page.locator('.option')).toHaveCount(5);
    await expect(page.locator('#btnResetProfessor')).toBeVisible();
    await expect(page.locator('#btnSkipProfessor')).toBeVisible();

    const selectionBefore = await page.evaluate(u => localStorage.getItem(`prova_sistemas_selecao_${u}`), 'admin');
    expect(selectionBefore).not.toBeNull();

    await page.click('#btnResetProfessor');

    await expect(page.locator('.option')).toHaveCount(5);
    const selectionAfter = await page.evaluate(u => localStorage.getItem(`prova_sistemas_selecao_${u}`), 'admin');
    expect(selectionAfter).not.toBeNull();
    // Praticamente impossível o sorteio de 20 de 78 repetir por acaso —
    // confirma que reiniciar de fato gerou uma seleção nova.
    expect(selectionAfter).not.toBe(selectionBefore);
  });

  test('gabarito lista o banco inteiro de 78 questões', async ({ page }) => {
    await page.goto('/turmas/sistemas/atividades/prova-sistemas.html?user=admin&role=professor&turma=sistemas');

    const download = await gerarGabaritoFlutuante(page);
    expect(download.suggestedFilename()).toBe('prova-sistemas-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('78)');
    expect(content).not.toContain('79)');
  });
});

test.describe('turmas/sistemas/plataforma.html — matéria Prova', () => {
  test('aparece a trilha Prova Diagnóstica, com a Prova travada só pela regra normal de matéria', async ({ page }) => {
    await stubSupabaseFake(page, SEED);
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Prova")');
    await expect(page.locator('#moduleSelector_prova-diagnostica')).toContainText('Prova Diagnóstica — Turma Sistemas');
  });
});

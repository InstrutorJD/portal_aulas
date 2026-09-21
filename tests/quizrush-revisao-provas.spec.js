// @ts-check
// "Revisão das provas" do QuizRush (games/quizrush.html, aba 📚): monta uma
// partida com perguntas de múltipla escolha e problemas de código sorteados do
// gabarito das provas da turma (Prova Diagnóstica e Prova Final — matéria
// 'prova' de turmas/sistemas/config.js). As práticas da Prova Final viram
// problemas do Quizz Prático (shared/quizrush-engine.js, examPracticeToQuestion).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');
const Code = require('../shared/quizrush-code.js');

const HOST_URL = '/games/quizrush.html?user=admin&role=professor&name=Professor&turma=sistemas';
const ALUNO_URL = '/games/quizrush.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=sistemas';

async function abrirRevisao(page) {
  await stubSupabaseFake(page, {});
  await page.goto(HOST_URL);
  await expect(page.locator('#scrSetup')).toBeVisible();
  await page.click('#tabModeExam');
  await expect(page.locator('#setupExamPanel')).toBeVisible();
  await expect(page.locator('#setupQuizPanel')).toBeHidden();
  await expect(page.locator('.chkExam')).toHaveCount(2);
}

test.describe('Revisão das provas — montagem pelo professor', () => {
  test('lista as provas, carrega o banco e cria a sessão mista (teoria + código)', async ({ page }) => {
    await abrirRevisao(page);
    await expect(page.locator('#examList')).toContainText('Prova Diagnóstica');
    await expect(page.locator('#examList')).toContainText('Prova Final');

    await page.click('#btnFetchExam');
    await expect(page.locator('#examResultText')).toContainText('problemas de código', { timeout: 20000 });
    await expect(page.locator('#examResultText')).toContainText('8 problemas de código');

    await page.fill('#inpExamTheory', '5');
    await page.fill('#inpExamCode', '3');
    await page.fill('#inpExamTheorySeconds', '20');
    await page.fill('#inpExamCodeSeconds', '90');
    await expect(page.locator('#examSetupHint')).toContainText('8 item');
    await page.click('#btnCreateExamSession');

    await expect(page.locator('#scrLobby')).toBeVisible();
    const sessions = await page.evaluate(() => window.__FAKE_DB__.quizrush_sessions || []);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ turma: 'sistemas', status: 'lobby', trilha_label: 'Revisão das provas', question_duration_ms: 20000 });
    expect(sessions[0].module_title).toContain('Prova Diagnóstica');
    const qs = sessions[0].questions;
    expect(qs).toHaveLength(8);
    qs.slice(0, 5).forEach(q => {
      expect(q.type).toBeUndefined();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(typeof q.correctIndex).toBe('number');
    });
    qs.slice(5).forEach(q => expect(q).toMatchObject({ type: 'code', lang: 'js', durationMs: 90000 }));
  });

  test('só a Prova Diagnóstica (sem questões práticas) gera revisão só de perguntas', async ({ page }) => {
    await abrirRevisao(page);
    await page.locator('.chkExam').nth(1).uncheck(); // tira a Prova Final
    await page.click('#btnFetchExam');
    await expect(page.locator('#examResultText')).toContainText('0 problemas de código', { timeout: 20000 });

    await page.fill('#inpExamTheory', '6');
    await page.fill('#inpExamCode', '3');
    await expect(page.locator('#examSetupHint')).toContainText('6 item');
    await page.click('#btnCreateExamSession');
    await expect(page.locator('#scrLobby')).toBeVisible();
    const sessions = await page.evaluate(() => window.__FAKE_DB__.quizrush_sessions);
    expect(sessions[0].questions).toHaveLength(6);
    sessions[0].questions.forEach(q => expect(q.type).toBeUndefined());
  });

  test('sem nada a sortear, não deixa criar', async ({ page }) => {
    await abrirRevisao(page);
    await page.click('#btnFetchExam');
    await expect(page.locator('#examResultText')).toContainText('perguntas', { timeout: 20000 });
    await page.fill('#inpExamTheory', '0');
    await page.fill('#inpExamCode', '0');
    await expect(page.locator('#btnCreateExamSession')).toBeDisabled();
    await expect(page.locator('#examSetupHint')).toContainText('Nada a sortear');
  });

  test('desmarcar todas as provas avisa e não cria', async ({ page }) => {
    await abrirRevisao(page);
    await page.locator('.chkExam:checked').first().uncheck();
    await page.locator('.chkExam:checked').first().uncheck();
    await page.click('#btnFetchExam');
    await expect(page.locator('#examResultText')).toContainText('pelo menos uma prova');
    await expect(page.locator('#btnCreateExamSession')).toBeDisabled();
  });
});

test.describe('Revisão das provas — problemas de código vindos da Prova Final', () => {
  /** @type {any[]} */
  let practical = [];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await stubSupabaseFake(page, {});
    await page.goto(HOST_URL);
    practical = await page.evaluate(async () => {
      const cfg = await window.QuizRushEngine.loadTurmaConfig('sistemas');
      const final = window.QuizRushEngine.listExamModules(cfg).find(c => c.trilhaKey === 'prova-final');
      const { practical } = await window.QuizRushEngine.fetchExamItems({ turma: 'sistemas', mod: final.mod, email: 'admin', examTitle: 'Prova Final' });
      return practical;
    });
    await page.close();
  });

  test('as 8 práticas viram problemas: a solução passa e o código inicial não', async () => {
    expect(practical).toHaveLength(8);
    for (const q of practical) {
      const ok = Code.runJsTests(q, q.solution);
      expect(ok.pass, `${q.title}: a solução da prova deveria passar — ${JSON.stringify(ok.lines)}`).toBe(true);
      const starter = Code.runJsTests(q, q.starter);
      expect(starter.pass, `${q.title}: o código inicial não pode passar sozinho`).toBe(false);
    }
    expect(practical.filter(q => q.mode === 'fix')).toHaveLength(6);
    expect(practical.filter(q => q.mode === 'write')).toHaveLength(2);
  });

  test('console.log(16) e console.log("16") valem igual (a prova compara como texto)', async () => {
    const soma = practical.find(q => q.title === 'Somar dois números');
    expect(Code.runJsTests(soma, 'let a = 7; let b = 9; console.log(a + b);').pass).toBe(true);
    expect(Code.runJsTests(soma, 'console.log("16");').pass).toBe(true);
    expect(Code.runJsTests(soma, 'console.log(17);').pass).toBe(false);
  });

  test('aluno corrige o bug: tempo próprio do problema, rótulo "corrija", acerto pontua e a revelação explica o erro', async ({ page }) => {
    const q = { ...practical.find(p => p.title === 'Total do pedido errado'), durationMs: 120000 };
    await stubSupabaseFake(page, {
      quizrush_sessions: [{
        id: 'revsess', turma: 'sistemas', created_by: 'admin', trilha_label: 'Revisão das provas', module_title: 'Prova Final',
        questions: [q], current_index: 0, status: 'question', question_duration_ms: 25000,
        question_started_at: new Date().toISOString(),
      }],
      quizrush_players: [{ session_id: 'revsess', student_email: 'breno.silva80', student_name: 'Breno Silva' }],
    });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#scrQuestion')).toBeVisible();
    await expect(page.locator('#qMeta')).toContainText('corrija o código');
    await expect(page.locator('#qPrompt')).toContainText('Resultado esperado no console');
    await expect(page.locator('#qCodeInput')).toHaveValue(q.starter);
    // o cronômetro usa os 120s do problema, não os 25s da sessão
    expect(parseInt(await page.locator('#qTimerNum').textContent(), 10)).toBeGreaterThan(100);

    await page.click('#btnCodeRun');
    await expect(page.locator('#qCodeOutput')).toContainText('esperado');
    await page.fill('#qCodeInput', q.solution);
    await page.click('#btnCodeRun');
    await expect(page.locator('#qStudentFeedbackText')).toContainText('Acertou');
    const answers = await page.evaluate(() => window.__FAKE_DB__.quizrush_answers);
    expect(answers[0]).toMatchObject({ is_correct: true, attempts: 2 });
  });

  test('revelação mostra a solução e a explicação do bug', async ({ page }) => {
    const q = { ...practical.find(p => p.title === 'Senha sempre aceita'), durationMs: 120000 };
    await stubSupabaseFake(page, {
      quizrush_sessions: [{
        id: 'revsess', turma: 'sistemas', created_by: 'admin', trilha_label: 'Revisão das provas', module_title: 'Prova Final',
        questions: [q], current_index: 0, status: 'reveal', question_duration_ms: 25000,
        question_started_at: new Date().toISOString(),
      }],
      quizrush_players: [],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrReveal')).toBeVisible();
    await expect(page.locator('#revealBars')).toContainText('senha === "1234"');
    await expect(page.locator('#revealBars')).toContainText('atribuição');
  });
});

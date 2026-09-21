// @ts-check
// Quizz Prático do QuizRush: partida de problemas de CÓDIGO no lugar de
// múltipla escolha (games/quizrush.html; banco em shared/quizrush-code-bank.js,
// correção em shared/quizrush-code.js). Mesmo fluxo do QuizRush (lobby,
// cronômetro, revelação, pódio), mas o aluno digita código e tem VÁRIAS
// tentativas dentro do tempo. A correção do banco em si (soluções passam,
// código inicial não passa) é testada em tests/quizrush-code-bank.spec.js.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');
const Bank = require('../shared/quizrush-code-bank.js');

const HOST_URL = '/games/quizrush.html?user=admin&role=professor&name=Professor&turma=jogos';
const ALUNO_URL = '/games/quizrush.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';

function bankQuestion(topicKey, problemId) {
  const topic = Bank.topics.find(t => t.key === topicKey);
  return Bank.toQuestion(topic, topic.problems.find(p => p.id === problemId));
}

function codeSession(question, extra = {}) {
  return {
    id: 'codesess', turma: 'jogos', created_by: 'admin',
    trilha_label: 'Quizz Prático', module_title: 'Funções',
    questions: [question], current_index: 0, status: 'question', question_duration_ms: 60000,
    question_started_at: new Date().toISOString(), ...extra,
  };
}
const codePlayers = [{ session_id: 'codesess', student_email: 'breno.silva80', student_name: 'Breno Silva' }];

test.describe('Quizz Prático — montagem pelo professor', () => {
  test('aba "Quizz Prático" lista os assuntos, valida a escolha e cria a sessão de código', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(HOST_URL);
    await expect(page.locator('#scrSetup')).toBeVisible();
    // o padrão continua sendo o quiz de múltipla escolha
    await expect(page.locator('#setupQuizPanel')).toBeVisible();
    await expect(page.locator('#setupCodePanel')).toBeHidden();

    await page.click('#tabModeCode');
    await expect(page.locator('#setupCodePanel')).toBeVisible();
    await expect(page.locator('#setupQuizPanel')).toBeHidden();
    await expect(page.locator('#codeTopicList')).toContainText('JavaScript');
    await expect(page.locator('#codeTopicList')).toContainText('SQL');
    await expect(page.locator('.chkTopic')).toHaveCount(Bank.topics.length);

    // sem nenhum assunto marcado, não deixa criar
    await page.locator('.chkTopic:checked').uncheck();
    await expect(page.locator('#btnCreateCodeSession')).toBeDisabled();
    await expect(page.locator('#codeSetupHint')).toContainText('pelo menos um assunto');

    await page.locator('.chkTopic[value="js-arrays"]').check();
    await page.fill('#inpCodeCount', '4');
    await page.fill('#inpCodeDuration', '90');
    await expect(page.locator('#codeSetupHint')).toContainText('4 de 8');
    await page.click('#btnCreateCodeSession');

    await expect(page.locator('#scrLobby')).toBeVisible();
    const sessions = await page.evaluate(() => window.__FAKE_DB__.quizrush_sessions || []);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ turma: 'jogos', status: 'lobby', created_by: 'admin', trilha_label: 'Quizz Prático', question_duration_ms: 90000 });
    expect(sessions[0].questions).toHaveLength(4);
    sessions[0].questions.forEach(q => expect(q).toMatchObject({ type: 'code', lang: 'js' }));
    const levels = sessions[0].questions.map(q => q.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b)); // do mais fácil pro mais difícil
  });

  test('pedir mais problemas do que existem usa todos os disponíveis', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(HOST_URL);
    await page.click('#tabModeCode');
    await page.locator('.chkTopic:checked').uncheck();
    await page.locator('.chkTopic[value="sql-join"]').check();
    await page.fill('#inpCodeCount', '15');
    await expect(page.locator('#codeSetupHint')).toContainText('terá esses 3');
    await page.click('#btnCreateCodeSession');
    await expect(page.locator('#scrLobby')).toBeVisible();
    const sessions = await page.evaluate(() => window.__FAKE_DB__.quizrush_sessions);
    expect(sessions[0].questions).toHaveLength(3);
  });

  test('voltar pra aba de múltipla escolha mostra o fluxo de sempre', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(HOST_URL);
    await page.click('#tabModeCode');
    await page.click('#tabModeQuiz');
    await expect(page.locator('#setupQuizPanel')).toBeVisible();
    await expect(page.locator('#selModule')).toBeVisible();
    await expect(page.locator('#setupCodePanel')).toBeHidden();
  });
});

test.describe('Quizz Prático — aluno resolvendo um problema de JavaScript', () => {
  const dobro = bankQuestion('js-funcoes', 'js-fn-1');

  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, { quizrush_sessions: [codeSession(dobro)], quizrush_players: codePlayers });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#scrQuestion')).toBeVisible();
  });

  test('mostra enunciado e editor com o código inicial (sem as alternativas do quiz)', async ({ page }) => {
    await expect(page.locator('#qPrompt')).toContainText('O dobro');
    await expect(page.locator('#qMeta')).toContainText('Problema 1 de 1');
    await expect(page.locator('#qMeta')).toContainText('complete o código');
    await expect(page.locator('#qCodeBox')).toBeVisible();
    await expect(page.locator('#qTiles')).toBeHidden();
    await expect(page.locator('#qCodeInput')).toHaveValue(dobro.starter);
    await expect(page.locator('#qCodeLang')).toContainText('JavaScript');
  });

  test('"____" que sobrou só avisa — não conta como tentativa nem grava resposta', async ({ page }) => {
    await page.click('#btnCodeRun');
    await expect(page.locator('#qCodeOutput')).toContainText('Ainda tem "____"');
    await expect(page.locator('#qCodeAttempts')).toHaveText('');
    expect(await page.evaluate(() => (window.__FAKE_DB__.quizrush_answers || []).length)).toBe(0);
  });

  test('errar mostra o que era esperado, várias tentativas são permitidas e a dica aparece depois de 2 erros', async ({ page }) => {
    await page.fill('#qCodeInput', 'function dobro(n) {\n  return n * 3;\n}');
    await page.click('#btnCodeRun');
    await expect(page.locator('#qCodeOutput')).toContainText('esperado 8');
    await expect(page.locator('#qCodeAttempts')).toHaveText('Tentativas: 1');
    await expect(page.locator('#qCodeHint')).toBeHidden();

    const answers = await page.evaluate(() => window.__FAKE_DB__.quizrush_answers);
    expect(answers).toHaveLength(1);
    expect(answers[0]).toMatchObject({ student_email: 'breno.silva80', is_correct: false, score: 0, attempts: 1 });

    await page.click('#btnCodeRun'); // segunda tentativa errada (mesmo código)
    await expect(page.locator('#qCodeAttempts')).toHaveText('Tentativas: 2');
    await expect(page.locator('#qCodeHint')).toBeVisible();
    await expect(page.locator('#qCodeHint')).toContainText('multiplicar por 2');
    // segue podendo tentar
    await expect(page.locator('#btnCodeRun')).toBeEnabled();
    await expect(page.locator('#qCodeInput')).toBeEnabled();
  });

  test('acertar depois de errar pontua menos (−100 por erro), trava o editor e sobrescreve a mesma linha', async ({ page }) => {
    await page.fill('#qCodeInput', 'function dobro(n) {\n  return n * 3;\n}');
    await page.click('#btnCodeRun');
    await expect(page.locator('#qCodeAttempts')).toHaveText('Tentativas: 1');

    await page.fill('#qCodeInput', 'function dobro(n) {\n  return n * 2;\n}');
    await page.click('#btnCodeRun');
    await expect(page.locator('#qStudentFeedbackText')).toContainText('Acertou');
    await expect(page.locator('#qCodeInput')).toBeDisabled();
    await expect(page.locator('#btnCodeRun')).toBeDisabled();

    const answers = await page.evaluate(() => window.__FAKE_DB__.quizrush_answers);
    expect(answers).toHaveLength(1); // a mesma linha, agora certa
    expect(answers[0]).toMatchObject({ is_correct: true, attempts: 2 });
    expect(answers[0].answer_text).toContain('n * 2');
    // respondeu quase na hora (≈1000) com 1 erro (−100)
    expect(answers[0].score).toBeGreaterThan(800);
    expect(answers[0].score).toBeLessThanOrEqual(900);
  });

  test('erro de sintaxe vira mensagem no console do problema (a página não quebra)', async ({ page }) => {
    await page.fill('#qCodeInput', 'function dobro(n) { return n * ; }');
    await page.click('#btnCodeRun');
    await expect(page.locator('#qCodeOutput .line.fail').first()).toBeVisible();
    await expect(page.locator('#scrQuestion')).toBeVisible();
  });

  test('laço infinito no código do aluno não trava a tela', async ({ page }) => {
    await page.fill('#qCodeInput', 'function dobro(n) { while (true) {} }');
    await page.click('#btnCodeRun');
    await expect(page.locator('#qCodeOutput')).toContainText('demorou demais', { timeout: 8000 });
    // a tela continua respondendo: dá pra editar e tentar de novo
    await page.fill('#qCodeInput', 'function dobro(n) { return n * 2; }');
    await page.click('#btnCodeRun');
    await expect(page.locator('#qStudentFeedbackText')).toContainText('Acertou');
  });

  test('Tab no editor indenta em vez de sair do campo', async ({ page }) => {
    await page.fill('#qCodeInput', 'x');
    await page.locator('#qCodeInput').press('Home');
    await page.locator('#qCodeInput').press('Tab');
    await expect(page.locator('#qCodeInput')).toHaveValue('  x');
  });
});

test.describe('Quizz Prático — SQL de verdade na partida', () => {
  test('aluno resolve um problema de SQL e vê o resultado da consulta numa tabela', async ({ page }) => {
    const q = bankQuestion('sql-agregacao', 'sql-agr-1');
    await stubSupabaseFake(page, { quizrush_sessions: [codeSession(q)], quizrush_players: codePlayers });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#qCodeLang')).toContainText('SQL');

    // maiúsculas/minúsculas e apelido de coluna diferentes da solução: vale igual
    await page.fill('#qCodeInput', 'select count(*) as total from funcionarios');
    await page.click('#btnCodeRun');
    await expect(page.locator('#qStudentFeedbackText')).toContainText('Acertou', { timeout: 20000 });
    await expect(page.locator('#qCodeOutput .sql-preview td').first()).toHaveText('5');

    const answers = await page.evaluate(() => window.__FAKE_DB__.quizrush_answers);
    expect(answers[0]).toMatchObject({ is_correct: true, attempts: 1 });
  });

  test('consulta com resultado errado não pontua', async ({ page }) => {
    const q = bankQuestion('sql-agregacao', 'sql-agr-2');
    await stubSupabaseFake(page, { quizrush_sessions: [codeSession(q)], quizrush_players: codePlayers });
    await page.goto(ALUNO_URL);

    await page.fill('#qCodeInput', 'SELECT AVG(salario) FROM funcionarios;');
    await page.click('#btnCodeRun');
    await expect(page.locator('#qCodeOutput')).toContainText('não bateu com o esperado', { timeout: 20000 });
    const answers = await page.evaluate(() => window.__FAKE_DB__.quizrush_answers);
    expect(answers[0]).toMatchObject({ is_correct: false, score: 0 });
  });
});

test.describe('Quizz Prático — estado, tempo e visão do professor', () => {
  const dobro = bankQuestion('js-funcoes', 'js-fn-1');

  test('recarregar a página depois de acertar mantém o problema resolvido (não deixa refazer)', async ({ page }) => {
    await stubSupabaseFake(page, {
      quizrush_sessions: [codeSession(dobro)], quizrush_players: codePlayers,
      quizrush_answers: [{ session_id: 'codesess', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 0, is_correct: true, score: 850, attempts: 2, answer_text: 'function dobro(n) { return n * 2; }' }],
    });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#qStudentFeedbackText')).toContainText('Acertou');
    await expect(page.locator('#qStudentFeedbackText')).toContainText('850');
    await expect(page.locator('#qCodeInput')).toBeDisabled();
    await expect(page.locator('#qCodeInput')).toHaveValue('function dobro(n) { return n * 2; }');
    await expect(page.locator('#qCodeAttempts')).toHaveText('Tentativas: 2');
  });

  test('com o tempo já esgotado o editor fica travado e avisa', async ({ page }) => {
    await stubSupabaseFake(page, {
      quizrush_sessions: [codeSession(dobro, { question_duration_ms: 20000, question_started_at: new Date(Date.now() - 5 * 60000).toISOString() })],
      quizrush_players: codePlayers,
    });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#qStudentFeedbackText')).toContainText('Tempo esgotado');
    await expect(page.locator('#qCodeInput')).toBeDisabled();
    await expect(page.locator('#btnCodeRun')).toBeDisabled();
  });

  test('professor vê o código inicial (sem editor) e o contador "acertaram · tentando"', async ({ page }) => {
    await stubSupabaseFake(page, {
      quizrush_sessions: [codeSession(dobro)],
      quizrush_players: [
        ...codePlayers,
        { session_id: 'codesess', student_email: 'edward.guzman', student_name: 'Edward Guzman' },
        { session_id: 'codesess', student_email: 'gabriella.borges5', student_name: 'Gabriella Borges' },
      ],
      quizrush_answers: [
        { session_id: 'codesess', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 0, is_correct: true, score: 900, attempts: 1 },
        { session_id: 'codesess', student_email: 'edward.guzman', student_name: 'Edward Guzman', question_index: 0, choice_index: 0, is_correct: false, score: 0, attempts: 3 },
      ],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#qCodeStatic')).toBeVisible();
    await expect(page.locator('#qCodeStatic')).toContainText('return n * ____');
    await expect(page.locator('#qCodeInput')).toBeHidden();
    await expect(page.locator('#btnCodeRun')).toBeHidden();
    await expect(page.locator('#qHostStatus')).toHaveText('1 acertaram · 1 tentando · 3 na sala');
  });

  test('revelação (professor) mostra a solução de exemplo e quem acertou', async ({ page }) => {
    await stubSupabaseFake(page, {
      quizrush_sessions: [codeSession(dobro, { status: 'reveal' })],
      quizrush_players: [...codePlayers, { session_id: 'codesess', student_email: 'edward.guzman', student_name: 'Edward Guzman' }],
      quizrush_answers: [
        { session_id: 'codesess', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 0, is_correct: true, score: 900, attempts: 2 },
        { session_id: 'codesess', student_email: 'edward.guzman', student_name: 'Edward Guzman', question_index: 0, choice_index: 0, is_correct: false, score: 0, attempts: 4 },
      ],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrReveal')).toBeVisible();
    await expect(page.locator('#revealBig')).toHaveText('Solução de exemplo');
    await expect(page.locator('#revealBars pre.code-static')).toContainText('return n * 2;');
    await expect(page.locator('#revealBars')).toContainText('1 acertaram');
    await expect(page.locator('#revealBars')).toContainText('1 tentaram e não fecharam');
    await expect(page.locator('#revealBars')).toContainText('Breno Silva (+900)');
    await expect(page.locator('#revealLeaderboard')).toContainText('900');
  });

  test('revelação (aluno): acertou, com a tentativa e a pontuação', async ({ page }) => {
    await stubSupabaseFake(page, {
      quizrush_sessions: [codeSession(dobro, { status: 'reveal' })], quizrush_players: codePlayers,
      quizrush_answers: [
        { session_id: 'codesess', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 0, is_correct: true, score: 900, attempts: 2 },
      ],
    });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#revealPersonalText')).toContainText('Você acertou');
    await expect(page.locator('#revealPersonalText')).toContainText('+900');
    await expect(page.locator('#revealPersonalText')).toContainText('tentativa 2');
  });

  test('revelação (aluno): tentou e não fechou, e quem nem enviou nada, veem mensagens próprias', async ({ page }) => {
    await stubSupabaseFake(page, {
      quizrush_sessions: [codeSession(dobro, { status: 'reveal' })], quizrush_players: codePlayers,
      quizrush_answers: [
        { session_id: 'codesess', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 0, is_correct: false, score: 0, attempts: 3 },
      ],
    });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#revealPersonalText')).toContainText('não fechou o problema');

    await stubSupabaseFake(page, { quizrush_sessions: [codeSession(dobro, { status: 'reveal' })], quizrush_players: codePlayers });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#revealPersonalText')).toContainText('não enviou nenhuma tentativa');
  });

  test('partida de código inteira: professor avança problema → revelação → pódio com os pontos somados', async ({ page }) => {
    const q1 = bankQuestion('js-funcoes', 'js-fn-1');
    const q2 = bankQuestion('js-funcoes', 'js-fn-2');
    await stubSupabaseFake(page, {
      quizrush_sessions: [codeSession(q1, { questions: [q1, q2] })],
      quizrush_players: codePlayers,
      quizrush_answers: [{ session_id: 'codesess', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 0, is_correct: true, score: 900, attempts: 1 }],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#qMeta')).toContainText('Problema 1 de 2');
    await page.click('#btnRevealNow');
    await page.click('#btnNextOrPodium');
    await expect(page.locator('#qMeta')).toContainText('Problema 2 de 2');
    await expect(page.locator('#qPrompt')).toContainText('Somando dois números');
    await expect(page.locator('#qCodeStatic')).toContainText('function soma');
    await page.click('#btnRevealNow');
    await page.click('#btnNextOrPodium');
    await expect(page.locator('#scrPodium')).toBeVisible();
    await expect(page.locator('#podiumFullList')).toContainText('Breno Silva');
    await expect(page.locator('#podiumFullList')).toContainText('900 pts');
  });

  test('a partida de múltipla escolha continua igual: sem editor de código na tela', async ({ page }) => {
    await stubSupabaseFake(page, {
      quizrush_sessions: [{
        id: 'sess1', turma: 'jogos', created_by: 'admin', trilha_label: 'C#', module_title: 'Básico',
        questions: [{ prompt: 'Quanto é 2 + 2?', options: ['3', '4', '5', '6'], correctIndex: 1 }],
        current_index: 0, status: 'question', question_duration_ms: 20000, question_started_at: new Date().toISOString(),
      }],
      quizrush_players: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva' }],
    });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#qTiles')).toBeVisible();
    await expect(page.locator('#qCodeBox')).toBeHidden();
  });
});

// @ts-check
// Kahoot da turma (games/kahoot.html + shared/kahoot-engine.js): o professor
// escolhe uma aula teórica e o motor busca as perguntas de múltipla escolha
// direto do gabarito dela (sem cadastrar nada novo); atividades práticas de
// código (sem options/correctIndex) não servem e a tela avisa. A pontuação
// de cada resposta depende de acerto + velocidade (fórmula do Kahoot).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const HOST_URL = '/games/kahoot.html?user=admin&role=professor&name=Professor&turma=jogos';
const ALUNO_URL = '/games/kahoot.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';

test.describe('Kahoot — montagem pelo professor (aproveitando o gabarito)', () => {
  test('busca as perguntas de uma aula teórica e cria a sessão', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(HOST_URL);

    await expect(page.locator('#scrSetup')).toBeVisible();
    await page.selectOption('#selModule', { label: 'Básico — A Jornada do Eri' });
    await page.click('#btnFetchQuestions');

    await expect(page.locator('#setupResultText')).toContainText('11 perguntas');
    await page.click('#btnCreateSession');

    await expect(page.locator('#scrLobby')).toBeVisible();
    const sessions = await page.evaluate(() => window.__FAKE_DB__.kahoot_sessions || []);
    expect(sessions.length).toBe(1);
    expect(sessions[0]).toMatchObject({ turma: 'jogos', status: 'lobby', created_by: 'admin' });
    expect(sessions[0].questions.length).toBe(11);
  });

  test('atividade prática de código não tem perguntas de múltipla escolha', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(HOST_URL);

    await page.selectOption('#selModule', { label: 'Básico — Desafios de JavaScript' });
    await page.click('#btnFetchQuestions');

    await expect(page.locator('#setupResultText')).toContainText('não tem perguntas de múltipla escolha');
    await expect(page.locator('#btnCreateSession')).toBeDisabled();
  });
});

test.describe('Kahoot — entrada e resposta do aluno', () => {
  const baseSession = {
    id: 'sess1', turma: 'jogos', created_by: 'admin',
    trilha_label: 'C#', module_title: 'Básico — A Jornada do Eri',
    questions: [{ prompt: 'Quanto é 2 + 2?', options: ['3', '4', '5', '6'], correctIndex: 1 }],
    current_index: 0, question_duration_ms: 20000,
  };

  test('aluno entra na sala em lobby e aparece na lista de jogadores', async ({ page }) => {
    await stubSupabaseFake(page, {
      kahoot_sessions: [{ ...baseSession, status: 'lobby', question_started_at: null }],
    });
    await page.goto(ALUNO_URL);

    await expect(page.locator('#scrJoin')).toBeVisible();
    await expect(page.locator('#joinModulo')).toHaveText('Básico — A Jornada do Eri');

    await page.click('#btnJoin');
    await expect(page.locator('#scrLobby')).toBeVisible();
    await expect(page.locator('#lobbyPlayers')).toContainText('Breno Silva');

    const players = await page.evaluate(() => window.__FAKE_DB__.kahoot_players || []);
    expect(players.find(p => p.student_email === 'breno.silva80')).toBeTruthy();
  });

  test('responder rápido e certo vale mais pontos que responder certo e devagar', async ({ page }) => {
    await stubSupabaseFake(page, {
      kahoot_sessions: [{ ...baseSession, status: 'question', question_started_at: new Date().toISOString() }],
      kahoot_players: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva' }],
    });
    await page.goto(ALUNO_URL);

    await expect(page.locator('#scrQuestion')).toBeVisible();
    // aluno não vê o enunciado nem o texto das opções — só a cor/forma,
    // pra ser obrigado a olhar a pergunta na tela do professor.
    await expect(page.locator('#qPrompt')).toContainText('tela do professor');
    await expect(page.locator('#qPrompt')).not.toContainText('2 + 2');
    await expect(page.locator('#qTiles')).not.toContainText('4');

    // opção correta é o índice 1 ("4")
    await page.locator('#qTiles .tile').nth(1).click();
    await expect(page.locator('#qStudentFeedbackText')).toContainText('Resposta enviada');

    const answers = await page.evaluate(() => window.__FAKE_DB__.kahoot_answers || []);
    expect(answers.length).toBe(1);
    expect(answers[0]).toMatchObject({ student_email: 'breno.silva80', choice_index: 1, is_correct: true });
    expect(answers[0].score).toBeGreaterThan(500); // respondeu quase instantaneamente
    expect(answers[0].score).toBeLessThanOrEqual(1000);
  });

  test('resposta errada não pontua', async ({ page }) => {
    await stubSupabaseFake(page, {
      kahoot_sessions: [{ ...baseSession, status: 'question', question_started_at: new Date().toISOString() }],
      kahoot_players: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva' }],
    });
    await page.goto(ALUNO_URL);

    await page.locator('#qTiles .tile').nth(0).click(); // opção errada ("3")

    const answers = await page.evaluate(() => window.__FAKE_DB__.kahoot_answers || []);
    expect(answers[0]).toMatchObject({ choice_index: 0, is_correct: false, score: 0 });
  });
});

test.describe('Kahoot — condução da partida pelo professor', () => {
  test('avança de pergunta → revelação → pódio, com o placar acumulando os acertos', async ({ page }) => {
    const session = {
      id: 'sess1', turma: 'jogos', created_by: 'admin',
      trilha_label: 'C#', module_title: 'Básico — A Jornada do Eri',
      questions: [
        { prompt: 'Quanto é 2 + 2?', options: ['3', '4', '5', '6'], correctIndex: 1 },
        { prompt: 'Quanto é 3 + 3?', options: ['5', '6', '7', '8'], correctIndex: 1 },
      ],
      current_index: 0, status: 'question', question_duration_ms: 20000,
      question_started_at: new Date().toISOString(),
    };
    await stubSupabaseFake(page, {
      kahoot_sessions: [session],
      kahoot_players: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva' }],
      kahoot_answers: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 1, is_correct: true, score: 900 }],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrQuestion')).toBeVisible();
    // tela do professor (projetada) mostra a pergunta e as opções por extenso
    await expect(page.locator('#qPrompt')).toContainText('2 + 2');
    await expect(page.locator('#qTiles')).toContainText('4');
    await expect(page.locator('#qHostStatus')).toContainText('1 de 1 responderam');

    await page.click('#btnRevealNow');
    await expect(page.locator('#scrReveal')).toBeVisible();
    await expect(page.locator('#revealLeaderboard')).toContainText('Breno Silva');
    await expect(page.locator('#revealLeaderboard')).toContainText('900');
    await expect(page.locator('#btnNextOrPodium')).toContainText('Próxima Pergunta');

    await page.click('#btnNextOrPodium');
    await expect(page.locator('#scrQuestion')).toBeVisible();
    await expect(page.locator('#qMeta')).toHaveText('Pergunta 2 de 2');

    await page.click('#btnRevealNow');
    await expect(page.locator('#btnNextOrPodium')).toContainText('Ver Pódio Final');
    await page.click('#btnNextOrPodium');

    await expect(page.locator('#scrPodium')).toBeVisible();
    await expect(page.locator('#podiumFullList')).toContainText('Breno Silva');

    const finalSession = await page.evaluate(() => window.__FAKE_DB__.kahoot_sessions.find(s => s.id === 'sess1'));
    expect(finalSession.status).toBe('podium');
  });
});

test.describe('Kahoot — cálculo de pontuação (shared/kahoot-engine.js)', () => {
  test('acerto rápido vale mais que acerto no limite do tempo; erro não pontua', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(HOST_URL);

    const fast = await page.evaluate(() => window.KahootEngine.scoreFor(true, 0, 20000));
    const slow = await page.evaluate(() => window.KahootEngine.scoreFor(true, 20000, 20000));
    const wrong = await page.evaluate(() => window.KahootEngine.scoreFor(false, 0, 20000));

    expect(fast).toBe(1000);
    expect(slow).toBe(500);
    expect(wrong).toBe(0);
  });
});

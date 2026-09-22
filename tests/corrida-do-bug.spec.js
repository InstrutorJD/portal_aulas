// @ts-check
// "Corrida do Bug" (games/corrida-do-bug.html + shared/corridadobug-engine.js):
// une o Fuga do Bug (plataforma, motor intocado — ver games/fuga-do-bug-engine.js)
// com o QuizRush (perguntas tiradas do gabarito de um módulo já existente,
// mesmo mecanismo de shared/quizrush-engine.js). A turma inteira corre a
// MESMA fase; em cada checkpoint (o motor do Fuga do Bug já tem esse
// conceito pronto — sim.cp/L.checks) aparece uma pergunta: acertou segue,
// errou volta pro checkpoint anterior (sim.respawn()), errou 2x SEGUIDAS no
// MESMO checkpoint perde pontos além de voltar.
//
// A travessia real de uma fase (pulos/timing) já tem cobertura própria e
// intocada em tests/fuga-do-bug*.spec.js — aqui o foco é só a integração
// NOVA, por isso os testes usam window.__corrida.forceCheckpoint(n) pra
// pular direto pro momento do checkpoint (mesmo espírito do
// window.finishLevel de tests/fuga-do-bug.spec.js).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const HOST_URL = '/games/corrida-do-bug.html?user=admin&role=professor&name=Professor&turma=jogos';
const ALUNO_URL = '/games/corrida-do-bug.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';

// Fase 1 (level_index 0) tem 2 checkpoints reais (games/fuga-do-bug-levels.js).
const baseSession = {
  id: 'race1', turma: 'jogos', created_by: 'admin', level_index: 0,
  trilha_label: 'Teste', module_title: 'Módulo de teste',
  questions: [
    { prompt: 'Pergunta do checkpoint 1?', options: ['Certa 1', 'Errada 1a', 'Errada 1b'], correctIndex: 0 },
    { prompt: 'Pergunta do checkpoint 2?', options: ['Certa 2', 'Errada 2a', 'Errada 2b'], correctIndex: 0 },
  ],
  status: 'lobby', started_at: null, created_at: new Date().toISOString(),
};

test.describe('Corrida do Bug — montagem pelo professor', () => {
  test('escolhe fase e atividade, busca as perguntas e cria a corrida', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(HOST_URL);

    await expect(page.locator('#scrSetup')).toBeVisible();
    await page.selectOption('#selLevel', '0'); // fase 1 — 2 checkpoints
    await page.selectOption('#selModule', { label: 'Teoria — Multimídia e Versionamento' });
    await page.click('#btnFetchQuestions');

    await expect(page.locator('#setupResultText')).toContainText('2 perguntas');
    await page.click('#btnCreateSession');

    await expect(page.locator('#scrLobby')).toBeVisible();
    const sessions = await page.evaluate(() => window.__FAKE_DB__.corridadobug_sessions || []);
    expect(sessions.length).toBe(1);
    expect(sessions[0]).toMatchObject({ turma: 'jogos', status: 'lobby', created_by: 'admin', level_index: 0 });
    expect(sessions[0].questions.length).toBe(2);
  });
});

test.describe('Corrida do Bug — lobby', () => {
  test('aluno detecta a sala e entra', async ({ page }) => {
    await stubSupabaseFake(page, { corridadobug_sessions: [baseSession] });
    await page.goto(ALUNO_URL);

    await expect(page.locator('#scrJoin')).toBeVisible();
    await page.click('#btnJoin');
    await expect(page.locator('#scrLobby')).toBeVisible();
    await expect(page.locator('#lobbyPlayers')).toContainText('Breno Silva');

    const players = await page.evaluate(() => window.__FAKE_DB__.corridadobug_players || []);
    expect(players).toHaveLength(1);
    expect(players[0]).toMatchObject({ session_id: 'race1', student_email: 'breno.silva80' });
  });

  test('professor inicia a corrida — status vira racing', async ({ page }) => {
    await stubSupabaseFake(page, {
      corridadobug_sessions: [baseSession],
      corridadobug_players: [{ session_id: 'race1', student_email: 'breno.silva80', student_name: 'Breno Silva' }],
    });
    await page.goto(HOST_URL);

    await expect(page.locator('#scrLobby')).toBeVisible();
    await page.click('#btnStartRace');
    await expect(page.locator('#scrHostRace')).toBeVisible();

    const sessions = await page.evaluate(() => window.__FAKE_DB__.corridadobug_sessions || []);
    expect(sessions[0].status).toBe('racing');
    expect(sessions[0].started_at).not.toBeNull();
  });
});

test.describe('Corrida do Bug — checkpoint (aluno)', () => {
  const racingSession = { ...baseSession, status: 'racing', started_at: new Date().toISOString() };

  test('carrega a corrida e mostra o HUD com o total de checkpoints da fase', async ({ page }) => {
    await stubSupabaseFake(page, { corridadobug_sessions: [racingSession] });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#scrRace')).toBeVisible();
    await expect(page.locator('#hudCheckpointTotal')).toHaveText('2');
    await expect(page.locator('#hudCheckpoint')).toHaveText('0');
  });

  test('responder certo no checkpoint soma pontos e libera a corrida', async ({ page }) => {
    await stubSupabaseFake(page, { corridadobug_sessions: [racingSession] });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#scrRace')).toBeVisible();

    await page.evaluate(() => window.__corrida.forceCheckpoint(1));
    await expect(page.locator('#cpOverlay')).toHaveClass(/show/);
    await page.click('.cp-option[data-choice="0"]'); // "Certa 1"
    await expect(page.locator('#cpFeedback')).toContainText('Isso mesmo');
    await expect(page.locator('#cpFeedback')).toHaveClass(/ok/);

    await expect.poll(() => page.evaluate(() => window.__corrida.lastCp)).toBe(1);
    const score = await page.evaluate(() => window.__corrida.score);
    expect(score).toBeGreaterThan(0);

    const progress = await page.evaluate(() => window.__FAKE_DB__.corridadobug_progress || []);
    expect(progress[0]).toMatchObject({ session_id: 'race1', student_email: 'breno.silva80', checkpoint: 1 });
  });

  test('errar 1x só volta pro checkpoint anterior, sem perder pontos', async ({ page }) => {
    await stubSupabaseFake(page, { corridadobug_sessions: [racingSession] });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#scrRace')).toBeVisible();

    await page.evaluate(() => window.__corrida.forceCheckpoint(1));
    await page.click('.cp-option[data-choice="1"]'); // errada
    await expect(page.locator('#cpFeedback')).toContainText('Não foi dessa vez');
    await expect(page.locator('#cpFeedback')).not.toHaveClass(/penalty/);

    await expect.poll(() => page.evaluate(() => window.__corrida.sim.cp)).toBe(0);
    const score = await page.evaluate(() => window.__corrida.score);
    expect(score).toBe(0);
  });

  test('errar 2x seguidas no mesmo checkpoint perde pontos, além de voltar', async ({ page }) => {
    await stubSupabaseFake(page, { corridadobug_sessions: [racingSession] });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#scrRace')).toBeVisible();

    // Passa o checkpoint 1 certo primeiro, só pra ter pontos suficientes
    // pra enxergar o desconto da penalidade no checkpoint 2.
    await page.evaluate(() => window.__corrida.forceCheckpoint(1));
    await page.click('.cp-option[data-choice="0"]');
    await expect.poll(() => page.evaluate(() => window.__corrida.lastCp)).toBe(1);
    const scoreAfterCp1 = await page.evaluate(() => window.__corrida.score);

    // 1º erro no checkpoint 2 — só volta, sem desconto ainda.
    await page.evaluate(() => window.__corrida.forceCheckpoint(2));
    await page.click('.cp-option[data-choice="1"]');
    await expect(page.locator('#cpFeedback')).not.toHaveClass(/penalty/);
    await expect.poll(() => page.evaluate(() => window.__corrida.score)).toBe(scoreAfterCp1);

    // 2º erro SEGUIDO no MESMO checkpoint 2 — agora desconta.
    await page.evaluate(() => window.__corrida.forceCheckpoint(2));
    await page.click('.cp-option[data-choice="1"]');
    await expect(page.locator('#cpFeedback')).toContainText('perdeu');
    await expect(page.locator('#cpFeedback')).toHaveClass(/penalty/);

    const finalScore = await page.evaluate(() => window.__corrida.score);
    expect(finalScore).toBe(scoreAfterCp1 - 200);
  });

  test('chegar na bandeira grava no placar (game_scores) e mostra a tela de chegada', async ({ page }) => {
    await stubSupabaseFake(page, { corridadobug_sessions: [racingSession] });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#scrRace')).toBeVisible();

    await page.evaluate(() => window.__corrida.forceCheckpoint(1));
    await page.click('.cp-option[data-choice="0"]');
    await expect.poll(() => page.evaluate(() => window.__corrida.lastCp)).toBe(1);

    await page.evaluate(() => window.__corrida.forceWin());
    await expect(page.locator('#scrFinish')).toBeVisible();
    await expect(page.locator('#finishStats')).toContainText('Pontuação final');

    const scores = await page.evaluate(() => window.__FAKE_DB__.game_scores || []);
    expect(scores).toHaveLength(1);
    expect(scores[0]).toMatchObject({ game: 'corridadobug', turma: 'jogos', student_email: 'breno.silva80' });

    const progress = await page.evaluate(() => window.__FAKE_DB__.corridadobug_progress || []);
    expect(progress[0].finished).toBe(true);
  });
});

test.describe('Corrida do Bug — visão do professor (placar ao vivo e encerramento)', () => {
  const racingSession = { ...baseSession, status: 'racing', started_at: new Date().toISOString() };

  test('placar ao vivo atualiza sozinho quando um aluno avança (Realtime)', async ({ page }) => {
    await stubSupabaseFake(page, {
      corridadobug_sessions: [racingSession],
      corridadobug_players: [{ session_id: 'race1', student_email: 'breno.silva80', student_name: 'Breno Silva' }],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrHostRace')).toBeVisible();
    await expect(page.locator('#hostLeaderboard')).toContainText('Breno Silva');
    await expect(page.locator('#hostLeaderboard')).toContainText('0/2');

    // Simula o progresso do aluno chegando via Realtime (mesmo padrão de
    // tests/quizrush-auto-avanco.spec.js: escreve direto no __FAKE_DB__ e
    // dispara o callback inscrito).
    await page.evaluate(() => {
      window.__FAKE_DB__.corridadobug_progress.push({
        session_id: 'race1', student_email: 'breno.silva80', student_name: 'Breno Silva',
        checkpoint: 1, misses: 0, score: 900, finished: false,
      });
      window.__fireFakeRealtime('corridadobug_progress');
    });

    await expect(page.locator('#hostLeaderboard')).toContainText('Breno Silva');
    await expect(page.locator('#hostLeaderboard')).toContainText('1/2');
    await expect(page.locator('#hostLeaderboard')).toContainText('900');
  });

  test('encerrar a corrida muda o status pra "ended" e mostra o pódio', async ({ page }) => {
    await stubSupabaseFake(page, {
      corridadobug_sessions: [racingSession],
      corridadobug_players: [{ session_id: 'race1', student_email: 'breno.silva80', student_name: 'Breno Silva' }],
      corridadobug_progress: [{ session_id: 'race1', student_email: 'breno.silva80', student_name: 'Breno Silva', checkpoint: 2, misses: 0, score: 1800, finished: true, finished_at: new Date().toISOString() }],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrHostRace')).toBeVisible();

    page.on('dialog', d => d.accept());
    await page.click('#btnEndRace');

    await expect(page.locator('#scrPodium')).toBeVisible();
    await expect(page.locator('#podiumList')).toContainText('Breno Silva');
    const sessions = await page.evaluate(() => window.__FAKE_DB__.corridadobug_sessions || []);
    expect(sessions[0].status).toBe('ended');
  });
});

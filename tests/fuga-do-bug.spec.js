// @ts-check
// "Fuga do Bug" (games/fuga-do-bug.html) — plataforma de armadilhas com
// tema de commit/bug, registrada em shared/platform-core.js (buildGames)
// junto com os outros jogos compartilhados entre as turmas. O nível é UM
// só (contínuo, termina em LEVEL_END_X), organizado em 8 "segmentos" de
// armadilhas com checkpoints entre eles — não são fases separadas
// selecionáveis num menu.
//
// A travessia real (pulos/timing) não dá pra automatizar de forma
// confiável via teclado simulado — por isso o "fim de fase" é testado
// chamando window.finishLevel() direto (mesmo padrão de window.endGame em
// games/digitacao.html, ver tests/game-leaderboard.spec.js).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const JOGOS_URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&name=Breno%20Silva&turma=jogos';
const GAME_URL = '/games/fuga-do-bug.html?user=breno.silva80&name=Breno%20Silva&turma=jogos';

async function unlockGamesAndOpen(page) {
  await stubSupabaseFake(page, {
    student_overrides: [{ student_email: 'breno.silva80', games_unlocked: true }],
  });
  await page.goto(JOGOS_URL);
  await page.click('#tabBtnJogos');
  await page.click('.game-card:has-text("Fuga do Bug")');
  return page.frameLocator('#gameFrame');
}

test.describe('turmas/jogos/plataforma.html — jogo "Fuga do Bug"', () => {
  test('aparece na lista de jogos e abre dentro do portal', async ({ page }) => {
    const frame = await unlockGamesAndOpen(page);
    await expect(page.locator('#gameFrameArea')).toBeVisible();
    await expect(page.locator('#gameFrameTitle')).toContainText('Fuga do Bug');
    await expect(frame.locator('#gameCanvas')).toBeVisible();
    await expect(frame.locator('#startOverlay')).toContainText('FUGA DO BUG');
  });
});

test.describe('games/fuga-do-bug.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('tela inicial explica os controles antes de começar', async ({ page }) => {
    await page.goto(GAME_URL);
    await expect(page.locator('#startOverlay')).toBeVisible();
    await expect(page.locator('#startOverlay')).toContainText('Setas / A D para mover');
    await expect(page.locator('#startOverlay')).toContainText('Espaço ou ▲ para pular');
    await expect(page.locator('#hudCheckpointTotal')).toHaveText('6'); // 6 checkpoints intermediários (8 segmentos, 1 nível só)
  });

  test('clicar "Iniciar" esconde a tela inicial e mostra o HUD de jogo', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    await expect(page.locator('#startOverlay')).toBeHidden();
    await expect(page.locator('#hudDeaths')).toHaveText('0');
    await expect(page.locator('#hudCheckpoint')).toHaveText('0');
  });

  test('chegar no fim da fase mostra a tela de vitória e grava o placar da turma', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(GAME_URL);
    await page.click('#btnStart');

    await page.evaluate(() => window.finishLevel());

    await expect(page.locator('#winOverlay')).toBeVisible();
    await expect(page.locator('#winOverlay')).toContainText('MERGE CONCLUÍDO');
    await expect(page.locator('#winStats')).toContainText('Mortes: 0');

    const scores = await page.evaluate(() => window.__FAKE_DB__.game_scores || []);
    expect(scores).toHaveLength(1);
    expect(scores[0].game).toBe('fuga_do_bug');
    expect(scores[0].turma).toBe('jogos');
    expect(scores[0].student_email).toBe('breno.silva80');
    expect(scores[0].score).toBeGreaterThan(0);
  });

  test('"Jogar de novo" reseta mortes e volta pro início da fase', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    await page.evaluate(() => window.finishLevel());
    await page.click('#btnRestart');

    await expect(page.locator('#winOverlay')).toBeHidden();
    await expect(page.locator('#hudDeaths')).toHaveText('0');
    await expect(page.locator('#hudCheckpoint')).toHaveText('0');
  });

  // O painel de placar usa o componente compartilhado
  // (shared/game-leaderboard.js, GameLeaderboard.showPanel) — mesmo
  // #glOverlay/.gl-row de todos os outros jogos, não um modal próprio.
  test('botão "Placar" mostra o ranking da turma pro jogo, com a própria linha destacada', async ({ page }) => {
    await stubSupabaseFake(page, {
      game_scores: [
        { student_email: 'edward.guzman', student_name: 'Edward Guzman', turma: 'jogos', game: 'fuga_do_bug', score: 98500 },
        { student_email: 'breno.silva80', student_name: 'Breno Silva', turma: 'jogos', game: 'fuga_do_bug', score: 87000 },
      ],
    });
    await page.goto(GAME_URL);
    await page.click('#btnRanking');

    const overlay = page.locator('#glOverlay');
    await expect(overlay).toContainText('Placar — Fuga do Bug');
    await expect(overlay.locator('.gl-row').nth(0)).toContainText('Edward Guzman');
    await expect(overlay.locator('.gl-row').nth(0)).toContainText('98500 pts');
    await expect(overlay.locator('.gl-row.me')).toContainText('Breno Silva');
  });

  test('sem ninguém ter pontuado ainda, mostra a mensagem de placar vazio (não "carregando" pra sempre)', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnRanking');
    await expect(page.locator('#glOverlay')).toContainText('Ninguém pontuou ainda');
  });

  test('terminar a fase grava o placar, e ele aparece na hora ao abrir o ranking', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    await page.evaluate(() => window.finishLevel());

    await page.click('#btnRanking');
    const overlay = page.locator('#glOverlay');
    await expect(overlay.locator('.gl-row.me')).toContainText('Breno Silva');
  });
});

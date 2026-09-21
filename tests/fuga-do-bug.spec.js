// @ts-check
// "Fuga do Bug" (games/fuga-do-bug.html) — plataforma de armadilhas com tema
// de commit/bug, registrada em shared/platform-core.js (buildGames) junto com
// os outros jogos compartilhados entre as turmas. São 10 fases, da mais fácil
// à mais difícil (games/fuga-do-bug-levels.js), com checkpoints dentro de cada
// uma. A física e a solubilidade de cada fase são testadas em
// tests/fuga-do-bug-fases.spec.js; aqui é a página: telas, HUD, fluxo entre
// fases, progresso salvo e placar.
//
// A travessia real (pulos/timing) não dá pra automatizar de forma confiável
// via teclado simulado — por isso "concluir a fase" é testado chamando
// window.finishLevel() direto (mesmo padrão de window.endGame em
// games/digitacao.html, ver tests/game-leaderboard.spec.js).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const JOGOS_URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&name=Breno%20Silva&turma=jogos';
const GAME_URL = '/games/fuga-do-bug.html?user=breno.silva80&name=Breno%20Silva&turma=jogos';
const GAME_KEY = 'fuga_do_bug_v2';

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

  test('tela inicial explica os controles e mostra as 10 fases (só a 1ª liberada)', async ({ page }) => {
    await page.goto(GAME_URL);
    await expect(page.locator('#startOverlay')).toBeVisible();
    await expect(page.locator('#startOverlay')).toContainText('Setas / A D para mover');
    await expect(page.locator('#startOverlay')).toContainText('Espaço ou ▲ para pular');
    await expect(page.locator('#levelGrid .lvl')).toHaveCount(10);
    await expect(page.locator('#levelGrid .lvl').nth(0)).toBeEnabled();
    await expect(page.locator('#levelGrid .lvl').nth(1)).toBeDisabled();
    await expect(page.locator('#levelGrid .lvl').nth(9)).toBeDisabled();
  });

  test('clicar "Iniciar" esconde a tela inicial e mostra o HUD da fase 1', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    await expect(page.locator('#startOverlay')).toBeHidden();
    await expect(page.locator('#hudLevel')).toHaveText('1');
    await expect(page.locator('#hudLevelTotal')).toHaveText('10');
    await expect(page.locator('#hudDeaths')).toHaveText('0');
    await expect(page.locator('#hudCheckpoint')).toHaveText('0');
    await expect(page.locator('#hudCheckpointTotal')).toHaveText('2'); // fase 1: 2 checkpoints intermediários
    await expect(page.locator('#banner')).toContainText('git init'); // apresentação da fase
  });

  test('segurar → move o jogador (a simulação roda de verdade no navegador)', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    const x0 = await page.evaluate(() => window.__fuga.sim.p.x);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    const x1 = await page.evaluate(() => window.__fuga.sim.p.x);
    expect(x1).toBeGreaterThan(x0 + 60);
  });

  test('cair num espinho mostra a tela de morte com dica, e Enter volta pro checkpoint', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    // Joga o jogador direto em cima de um espinho da fase 1 (armadilha real, não fabricada).
    await page.evaluate(() => {
      const s = window.__fuga.sim, sp = s.L.spikes[0];
      s.p.x = sp.x - 4; s.p.y = sp.y - 20;
    });
    await expect(page.locator('#deathOverlay')).toBeVisible();
    await expect(page.locator('#deathTip')).not.toBeEmpty();
    await expect(page.locator('#hudDeaths')).toHaveText('1');
    await page.waitForTimeout(300); // pequena trava anti-Enter-por-acidente
    await page.keyboard.press('Enter');
    await expect(page.locator('#deathOverlay')).toBeHidden();
    expect(await page.evaluate(() => window.__fuga.sim.dead)).toBe(false);
    await expect(page.locator('#hudDeaths')).toHaveText('1'); // a morte fica contada
  });

  test('concluir a fase 1 mostra a tela de fase concluída e libera a fase 2', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    await page.evaluate(() => window.finishLevel());

    await expect(page.locator('#levelOverlay')).toBeVisible();
    await expect(page.locator('#levelTitle')).toContainText('FASE 1');
    await expect(page.locator('#levelStats')).toContainText('Mortes: 0');

    await page.click('#btnNext');
    await expect(page.locator('#levelOverlay')).toBeHidden();
    await expect(page.locator('#hudLevel')).toHaveText('2');
    await expect(page.locator('#banner')).toContainText('git add');
  });

  test('o progresso fica salvo: ao reabrir, a fase 2 está liberada e o botão vira "Continuar"', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    await page.evaluate(() => window.finishLevel());
    await page.reload();

    await expect(page.locator('#levelGrid .lvl').nth(0)).toHaveClass(/done/);
    await expect(page.locator('#levelGrid .lvl').nth(1)).toBeEnabled();
    await expect(page.locator('#levelGrid .lvl').nth(2)).toBeDisabled();
    await expect(page.locator('#btnStart')).toContainText('Continuar (fase 2)');
    await page.click('#btnStart');
    await expect(page.locator('#hudLevel')).toHaveText('2');
  });

  test('chegar no fim da última fase mostra a tela de vitória e grava o placar da turma', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    await page.evaluate(() => window.__fuga.loadLevel(9));
    await page.evaluate(() => window.finishLevel());

    await expect(page.locator('#winOverlay')).toBeVisible();
    await expect(page.locator('#winOverlay')).toContainText('MERGE CONCLUÍDO');
    await expect(page.locator('#winStats')).toContainText('Mortes: 0');

    const scores = await page.evaluate(() => window.__FAKE_DB__.game_scores || []);
    expect(scores).toHaveLength(1);
    expect(scores[0].game).toBe(GAME_KEY);
    expect(scores[0].turma).toBe('jogos');
    expect(scores[0].student_email).toBe('breno.silva80');
    expect(scores[0].score).toBeGreaterThan(0);
  });

  test('a pontuação acumula fase a fase e é gravada a cada fase concluída', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    await page.evaluate(() => window.finishLevel());
    const depoisDaFase1 = (await page.evaluate(() => window.__FAKE_DB__.game_scores))[0].score;
    await page.click('#btnNext');
    await page.evaluate(() => window.finishLevel());
    await expect.poll(async () => (await page.evaluate(() => window.__FAKE_DB__.game_scores))[0].score).toBeGreaterThan(depoisDaFase1);
  });

  test('"Jogar de novo" volta pra fase 1 com mortes zeradas', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    await page.evaluate(() => window.__fuga.loadLevel(9));
    await page.evaluate(() => window.finishLevel());
    await page.click('#btnRestart');

    await expect(page.locator('#winOverlay')).toBeHidden();
    await expect(page.locator('#hudLevel')).toHaveText('1');
    await expect(page.locator('#hudDeaths')).toHaveText('0');
    await expect(page.locator('#hudCheckpoint')).toHaveText('0');
  });

  test('botão "Fases" reabre o menu e dá pra escolher uma fase já liberada', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    await page.evaluate(() => window.finishLevel());
    await page.click('#btnNext');
    await page.click('#btnLevels');
    await expect(page.locator('#startOverlay')).toBeVisible();
    await page.locator('#levelGrid .lvl').nth(0).click();
    await expect(page.locator('#hudLevel')).toHaveText('1');
  });

  // O painel de placar usa o componente compartilhado
  // (shared/game-leaderboard.js, GameLeaderboard.showPanel) — mesmo
  // #glOverlay/.gl-row de todos os outros jogos, não um modal próprio.
  test('botão "Placar" mostra o ranking da turma pro jogo, com a própria linha destacada', async ({ page }) => {
    await stubSupabaseFake(page, {
      game_scores: [
        { student_email: 'edward.guzman', student_name: 'Edward Guzman', turma: 'jogos', game: GAME_KEY, score: 98500 },
        { student_email: 'breno.silva80', student_name: 'Breno Silva', turma: 'jogos', game: GAME_KEY, score: 87000 },
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

  test('concluir uma fase grava o placar, e ele aparece na hora ao abrir o ranking', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.click('#btnStart');
    await page.evaluate(() => window.finishLevel());

    await page.click('#btnRanking');
    const overlay = page.locator('#glOverlay');
    await expect(overlay.locator('.gl-row.me')).toContainText('Breno Silva');
  });
});

// @ts-check
// "Corrida do Bug (Engel)" — versão SOLO e adaptada da Corrida do Bug
// (games/corrida-do-bug.html): mesmo motor do Fuga do Bug (fase 1, sem
// tocar no motor original — tests/fuga-do-bug*.spec.js continuam a fonte
// de verdade da física), mas cada checkpoint pede uma frase do "Formar
// Frases" (mesmo conteúdo de frases-engel.html) em vez de pergunta de
// quiz, e sem nada de rede/pontuação competitiva — só o progresso local de
// sempre (mesmo padrão das outras atividades adaptadas do Engel).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, gerarGabaritoFlutuante } = require('./helpers');

const PROFESSOR_URL = '/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos';
const ENGEL_URL = '/turmas/jogos/plataforma.html?user=engel.fraga&ip=192.168.1.20&saldo=1000.00&role=aluno&turma=jogos';
const BRENO_URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos';

async function openComunicacao(page) {
  await page.click('.game-card:has-text("Comunicação (Engel)")');
}

test.describe('Trilha individual "Corrida do Bug (Engel)"', () => {
  test('professor sempre vê a trilha, mesmo não estando na lista de visibleFor', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(PROFESSOR_URL);
    await openComunicacao(page);
    await expect(page.locator('#trilhaSelect option[value="corrida-do-bug-engel"]')).toHaveCount(1);
  });

  test('engel.fraga vê a própria trilha e consegue abrir o módulo', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await openComunicacao(page);
    await expect(page.locator('#trilhaSelect option[value="corrida-do-bug-engel"]')).toHaveCount(1);

    await page.selectOption('#trilhaSelect', 'corrida-do-bug-engel');
    await expect(page.locator('#subTabContent_corrida-do-bug-engel')).toBeVisible();
    await page.click('#moduleSelector_corrida-do-bug-engel .game-card');
    await expect(page.locator('#moduleFrame_corrida-do-bug-engel')).toHaveAttribute(
      'src', /atividades\/corrida-do-bug-engel\.html\?user=engel\.fraga/
    );
  });

  test('outro aluno (fora da lista) não vê a trilha', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(BRENO_URL);
    // "Comunicação (Engel)" é matéria inteira restrita — nem o card aparece
    // pra quem não é o Engel (ver tests/frases-engel.spec.js).
    await expect(page.locator('#materiaCardGrid')).not.toContainText('Comunicação (Engel)');
  });
});

test.describe('Jogo "Corrida do Bug (Engel)"', () => {
  const URL = '/turmas/jogos/atividades/corrida-do-bug-engel.html?user=engel.fraga&role=aluno&turma=jogos';

  test('mostra a tela de regras antes de começar, não a corrida direto', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(URL);
    await expect(page.locator('#startOverlay')).toBeVisible();
    await expect(page.locator('#startOverlay')).toContainText('checkpoint');
  });

  test('completar o checkpoint com a frase certa deixa continuar', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(URL);
    await page.click('#btnStart');
    await expect(page.locator('#startOverlay')).toBeHidden();

    await page.evaluate(() => window.__corridaEngel.forceCheckpoint(1));
    await expect(page.locator('#cpOverlay')).toHaveClass(/show/);
    await expect(page.locator('#clueEmoji')).toHaveText('☀️');
    await expect(page.locator('#sentenceBox')).toContainText('Bom');

    await page.click('.word-btn:has-text("Dia")');
    await expect(page.locator('#cpFeedback')).toContainText('Isso mesmo');
    await expect.poll(() => page.evaluate(() => window.__corridaEngel.lastCp)).toBe(1);
  });

  test('errar a frase volta pro checkpoint anterior', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(URL);
    await page.click('#btnStart');

    await page.evaluate(() => window.__corridaEngel.forceCheckpoint(1));
    await page.click('.word-btn:has-text("Noite")'); // errada — a certa é "Dia"
    await expect(page.locator('#cpFeedback')).toContainText('Não foi dessa vez');

    await expect.poll(() => page.evaluate(() => window.__corridaEngel.sim.cp)).toBe(0);
    await expect.poll(() => page.evaluate(() => window.__corridaEngel.lastCp)).toBe(0);
  });

  test('chegar na bandeira marca a atividade como concluída (sem placar competitivo)', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(URL);
    await page.click('#btnStart');

    await page.evaluate(() => window.__corridaEngel.forceWin());
    await expect(page.locator('#finishOverlay')).toBeVisible();
    await expect(page.locator('#finishStats')).not.toContainText('pontos');
    await expect(page.locator('#finishStats')).not.toContainText('ranking');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`corrida_do_bug_engel_progress_${u}`)), 'engel.fraga');
    expect(progress).toMatchObject({ completed: true });
  });

  test('gabarito lista os 2 checkpoints com a resposta completa', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/atividades/corrida-do-bug-engel.html?user=admin&role=professor&turma=jogos');

    const download = await gerarGabaritoFlutuante(page);
    expect(download.suggestedFilename()).toBe('corrida-do-bug-engel-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('Bom Dia');
    expect(content).toContain('Boa Noite');
  });
});

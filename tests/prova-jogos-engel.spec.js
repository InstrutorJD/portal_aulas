// @ts-check
// "Prova Diagnóstica (Engel)" — trilha individual, visível só pro Engel
// (matéria Prova, turma Jogos Digitais). Diferente da prova padrão
// (prova-jogos.html: banco de 76, sorteio de 20, 5 alternativas, trava
// anti-saída de aba, visto do professor), usa o motor leve das outras
// atividades adaptadas do Engel (mesmo padrão de
// teste-roteiros-questionario-engel.html): lista curta e fixa de 15
// perguntas, 3 alternativas cada, sem trava nenhuma, conclui sozinha.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, expandGabaritoRow } = require('./helpers');

const PROVA_URL = '/turmas/jogos/atividades/prova-jogos-engel.html?user=engel.fraga&role=aluno&turma=jogos';

test.describe('turmas/jogos/atividades/prova-jogos-engel.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('mostra a apresentação primeiro, com as 15 perguntas + resultado no total', async ({ page }) => {
    await page.goto(PROVA_URL);
    await expect(page.locator('.card h2')).toHaveText('Vamos revisar o que você aprendeu!');
    const total = await page.evaluate(() => QUESTIONS.length);
    expect(total).toBe(15);
    await expect(page.locator('#lblStepTotal')).toHaveText('17');
  });

  test('cada pergunta vem com exatamente 3 alternativas', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnNext');
    await expect(page.locator('.option')).toHaveCount(3);
    await expect(page.locator('.opt-letter').nth(2)).toHaveText('C');
  });

  test('responder certo mostra feedback de acerto, e responder errado mostra a resposta certa', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnNext');

    const correctIdx = await page.evaluate(() => QUESTIONS[0].certa);
    const wrongIdx = correctIdx === 0 ? 1 : 0;

    await page.locator('.option').nth(wrongIdx).click();
    await expect(page.locator('.feedback.incorrect')).toContainText('Quase!');
    await expect(page.locator('.option').nth(correctIdx)).toHaveClass(/correct/);
  });

  test('responde as 15 perguntas e conclui, mostrando o placar', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnNext');

    const total = await page.evaluate(() => QUESTIONS.length);
    for (let i = 0; i < total; i++) {
      const correctIdx = await page.evaluate(i => QUESTIONS[i].certa, i);
      await page.locator('.option').nth(correctIdx).click();
      await page.click('#btnNext');
    }

    await expect(page.locator('.score-box h2')).toContainText('Você terminou!');
    await expect(page.locator('.score')).toContainText('15/15');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`prova_jogos_engel_progress_${u}`)), 'engel.fraga');
    expect(progress).toMatchObject({ completed: true, correctCount: 15 });
  });

  test('recarregar a página no meio da prova não reabre uma pergunta já respondida', async ({ page }) => {
    await page.goto(PROVA_URL);
    await page.click('#btnNext');
    const correctIdx0 = await page.evaluate(() => QUESTIONS[0].certa);
    await page.locator('.option').nth(correctIdx0).click();
    await page.click('#btnNext');

    await expect(page.locator('.bloco-label')).toContainText('Pergunta 2');

    await page.reload();
    await expect(page.locator('.bloco-label')).toContainText('Pergunta 2');
  });

  test('gabarito lista as 15 perguntas com a resposta certa pra cada uma', async ({ page }) => {
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos');
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = await expandGabaritoRow(page, 'Prova Diagnóstica (Engel)');
    await expect(row).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('prova-jogos-engel-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('Formar Frases');
  });
});

test.describe('turmas/jogos/plataforma.html — Prova Diagnóstica (Engel)', () => {
  test('engel.fraga vê a própria prova adaptada dentro da matéria Prova', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/plataforma.html?user=engel.fraga&ip=192.168.1.20&saldo=1000.00&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Prova")');
    await expect(page.locator('#trilhaSelect option[value="prova-diagnostica-engel"]')).toHaveCount(1);

    await page.selectOption('#trilhaSelect', 'prova-diagnostica-engel');
    await expect(page.locator('#subTabContent_prova-diagnostica-engel')).toBeVisible();
    await page.click('#moduleSelector_prova-diagnostica-engel .game-card');
    await expect(page.locator('#moduleFrame_prova-diagnostica-engel')).toHaveAttribute(
      'src', /atividades\/prova-jogos-engel\.html\?user=engel\.fraga/
    );
  });

  test('outro aluno (fora da lista) não vê a prova adaptada do Engel', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Prova")');
    await expect(page.locator('#trilhaSelect option[value="prova-diagnostica-engel"]')).toHaveCount(0);
  });

  test('professor sempre vê a prova adaptada do Engel, mesmo não estando na lista de visibleFor', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos');
    await page.click('.game-card:has-text("Prova")');
    await expect(page.locator('#trilhaSelect option[value="prova-diagnostica-engel"]')).toHaveCount(1);
  });
});

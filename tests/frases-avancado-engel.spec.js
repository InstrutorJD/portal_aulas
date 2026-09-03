// @ts-check
// 2ª atividade de "Formar Frases (Engel)" — mesma trilha de
// atividades/frases-engel.html (matéria dedicada "Comunicação (Engel)",
// ver tests/frases-engel.spec.js pros testes de visibilidade do card), só
// que travada até concluir a 1ª (requires:'jogo' em turmas/jogos/
// config.js) e mais difícil: falta mais de 1 palavra por frase, clicada em
// ORDEM, com a pista de cada uma revelada só quando chega a vez dela.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, expandGabaritoRow } = require('./helpers');

const PROFESSOR_URL = '/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos';
const ENGEL_URL = '/turmas/jogos/plataforma.html?user=engel.fraga&ip=192.168.1.20&saldo=1000.00&role=aluno&turma=jogos';

const TOKEN_VALIDO = '482913';
const SEED_PROFESSOR = {
  profiles: [
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
  professor_tokens: [
    { token: TOKEN_VALIDO, created_by: 'fake-admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  ],
};

// Sequência de palavras certas de cada uma das 15 frases (na ordem dos
// blanks) — mesma ordem/conteúdo de CHALLENGES em
// atividades/frases-avancado-engel.html.
const ANSWERS = [
  ['comer', 'maçã'], ['lavar', 'mãos'], ['comer', 'pizza'], ['comer', 'bolo'], ['beber', 'suco'],
  ['comer', 'sorvete'], ['comer', 'chocolate'], ['comer', 'osso'], ['assistir', 'filme'], ['jogar', 'futebol'],
  ['estudar', 'matemática', 'cedo'], ['comprar', 'presente', 'tarde'], ['desenhar', 'gato', 'agora'],
  ['assistir', 'filme', 'noite'], ['ajudar', 'mamãe', 'depois'],
];

async function clickWord(frame, word) {
  await frame.locator('.word-btn', { hasText: new RegExp(`^${word}$`) }).click();
}

async function solveSequence(frame, words) {
  for (const word of words) await clickWord(frame, word);
}

// Pula direto a 1ª atividade (já toda respondida) pra abrir a 2ª — mesmo
// padrão de outras trilhas "requires" já testadas no portal.
async function openJogoAvancado(page, seed = {}) {
  await stubSupabaseFake(page, seed);
  await page.addInitScript(u => {
    const todasIds = Array.from({ length: 15 }, (_, i) => i + 1);
    localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(todasIds));
  }, 'engel.fraga');
  await page.goto(ENGEL_URL);
  await page.click('.game-card:has-text("Comunicação (Engel)")');
  await page.click('#moduleSelector_frases-engel .game-card:has-text("Avançado")');
  const frame = page.frameLocator('#moduleFrame_frases-engel');
  await frame.locator('#btnIniciar').click();
  return frame;
}

test.describe('Trilha "Formar Frases" — 2ª atividade trava até concluir a 1ª', () => {
  test('aparece na lista, travada, com os 2 módulos em ordem', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await expect(page.locator('#moduleSelector_frases-engel')).toContainText('Formar Frases — Associação de Palavras');
    await expect(page.locator('#moduleSelector_frases-engel')).toContainText('Formar Frases — Avançado');
    await expect(page.locator('#moduleSelector_frases-engel .game-card.locked', { hasText: 'Avançado' })).toHaveCount(1);
  });

  test('concluindo a 1ª atividade, a 2ª destrava', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      const todasIds = Array.from({ length: 15 }, (_, i) => i + 1);
      localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(todasIds));
    }, 'engel.fraga');
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await expect(page.locator('#moduleSelector_frases-engel .game-card.locked', { hasText: 'Avançado' })).toHaveCount(0);
  });
});

test.describe('Jogo "Formar Frases — Avançado (Engel)"', () => {
  test('mostra a tela de regras explicando a mecânica mais difícil', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(Array.from({ length: 15 }, (_, i) => i + 1)));
    }, 'engel.fraga');
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await page.click('#moduleSelector_frases-engel .game-card:has-text("Avançado")');
    const frame = page.frameLocator('#moduleFrame_frases-engel');

    await expect(frame.locator('#gateWrap')).toContainText('VÁRIAS');
    await expect(frame.locator('#stageWrap')).toBeHidden();
  });

  test('a pista da 2ª palavra só aparece depois de acertar a 1ª', async ({ page }) => {
    const frame = await openJogoAvancado(page);
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · 3 palavras (2 na ordem certa)');
    await expect(frame.locator('.clue-row .clue.pending')).toHaveText('❔');
    await expect(frame.locator('.clue-row .clue.active')).toHaveText('🍽️');

    await clickWord(frame, 'comer');
    await expect(frame.locator('#sentenceBox .filled').first()).toHaveText('comer');
    await expect(frame.locator('.clue-row .clue.active')).toHaveText('🍎');
    await expect(frame.locator('.clue-row .clue.pending')).toHaveCount(0);
    // ainda não terminou a frase — sem "Próxima" ainda.
    await expect(frame.locator('#btnNext')).toBeHidden();
  });

  test('errar a 1ª palavra trava a frase inteira na hora, sem chance de continuar a sequência', async ({ page }) => {
    const frame = await openJogoAvancado(page);
    await clickWord(frame, 'dormir'); // distrator do desafio 1
    await expect(frame.locator('#feedback')).toContainText('Não foi dessa vez');
    await expect(frame.locator('.word-btn', { hasText: 'dormir' })).toHaveClass(/wrong-pick/);

    const buttons = frame.locator('.word-btn');
    await expect(buttons).toHaveCount(3);
    for (let i = 0; i < 3; i++) await expect(buttons.nth(i)).toBeDisabled();

    await expect(frame.locator('#btnNext')).toBeVisible();
    await expect(frame.locator('.step-icon').first()).toHaveClass(/wrong/);
  });

  test('acertar a 1ª e errar a 2ª também trava a frase — não é "tenta de novo só essa palavra"', async ({ page }) => {
    const frame = await openJogoAvancado(page);
    await clickWord(frame, 'comer'); // certa
    await clickWord(frame, 'dormir'); // errada (era "maçã")
    await expect(frame.locator('#feedback')).toContainText('Não foi dessa vez');
    // a 1ª palavra continua marcada como certa (fill parcial preservado).
    await expect(frame.locator('#sentenceBox .filled').first()).toHaveText('comer');
    await expect(frame.locator('#sentenceBox .blank')).toHaveCount(1);
    await expect(frame.locator('#btnNext')).toBeVisible();
  });

  test('acertar as 2 palavras em ordem completa a frase e libera a próxima', async ({ page }) => {
    const frame = await openJogoAvancado(page);
    await solveSequence(frame, ['comer', 'maçã']);
    await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
    await expect(frame.locator('#sentenceBox .filled')).toHaveCount(2);
    await expect(frame.locator('.step-icon').first()).toHaveClass(/completed/);
    await expect(frame.locator('#btnNext')).toBeVisible();

    await frame.locator('#btnNext').click();
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · 3 palavras (2 na ordem certa)');
  });

  test('nível 3 exige 3 palavras em ordem (5 palavras na frase)', async ({ page }) => {
    const frame = await openJogoAvancado(page);
    for (let i = 0; i < 10; i++) {
      await solveSequence(frame, ANSWERS[i]);
      await frame.locator('#btnNext').click();
    }
    await expect(frame.locator('#levelTag')).toHaveText('Nível 3 · 5 palavras (3 na ordem certa)');
    await solveSequence(frame, ANSWERS[10]);
    await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
    await expect(frame.locator('#sentenceBox .filled')).toHaveCount(3);
  });

  test('resolve as 15 frases (errando de propósito a 1ª) e mostra o placar no troféu final', async ({ page }) => {
    const frame = await openJogoAvancado(page);

    await clickWord(frame, 'dormir'); // erro proposital na frase 1
    await frame.locator('#btnNext').click();

    for (let i = 1; i < ANSWERS.length; i++) {
      await solveSequence(frame, ANSWERS[i]);
      if (i < ANSWERS.length - 1) await frame.locator('#btnNext').click();
    }

    await expect(frame.locator('.trophy-box')).toContainText('Terminou tudo!');
    await expect(frame.locator('.trophy-box')).toContainText('Você acertou 14 de 15 sozinho.');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`frases_engel_avancado_progress_${u}`)), 'engel.fraga');
    expect(progress).toHaveLength(15);
    const results = await page.evaluate(u => JSON.parse(localStorage.getItem(`frases_engel_avancado_results_${u}`)), 'engel.fraga');
    expect(results['1']).toBe('wrong');
    expect(results['2']).toBe('correct');
  });

  test('botão "Pular (professor)" preenche a frase inteira de uma vez', async ({ page }) => {
    const frame = await openJogoAvancado(page, SEED_PROFESSOR);

    await frame.locator('#btnSkip').click();
    await frame.locator('#skipToken').fill(TOKEN_VALIDO);
    await frame.locator('#btnConfirmSkip').click();

    await expect(frame.locator('#feedback')).toContainText('Pulado pelo professor');
    await expect(frame.locator('#sentenceBox .filled')).toHaveCount(2);
    await expect(frame.locator('#btnNext')).toBeVisible();
  });

  test('gabarito lista as 15 frases com a resposta completa', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(PROFESSOR_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = await expandGabaritoRow(page, 'Formar Frases — Avançado');
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('frases-avancado-engel-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('Eu quero comer maçã');
    expect(content).toContain('Hoje nós vamos ajudar mamãe depois');
  });
});

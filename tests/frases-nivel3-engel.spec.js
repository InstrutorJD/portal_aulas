// @ts-check
// 3ª atividade de "Formar Frases (Engel)" — mesma trilha de
// atividades/frases-engel.html e frases-avancado-engel.html (matéria
// dedicada "Comunicação (Engel)", ver tests/frases-engel.spec.js pros
// testes de visibilidade do card), travada até concluir a 2ª (Avançado) —
// mesmo mecanismo da avançada (clicar palavras em ORDEM, pista revelada
// só quando chega a vez dela), só que com mais palavras faltando (3 a 5,
// contra 2 a 3 da avançada) e mais distratoras no pool.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, gerarGabaritoFlutuante } = require('./helpers');

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
// atividades/frases-nivel3-engel.html.
const ANSWERS = [
  ['tomar', 'sopa', 'quente'], ['comprar', 'sapato', 'novo'], ['ler', 'livro', 'grande'],
  ['pintar', 'quadro', 'bonito'], ['beber', 'suco', 'gelado'],
  ['lavar', 'roupa', 'suja', 'cedo'], ['limpar', 'quarto', 'bagunçado', 'juntos'],
  ['cozinhar', 'arroz', 'gostoso', 'agora'], ['construir', 'castelo', 'alto', 'sozinho'],
  ['plantar', 'flor', 'amarela', 'amanhã'],
  ['vou', 'estudar', 'matemática', 'difícil', 'sozinho'], ['vamos', 'visitar', 'vovó', 'querida', 'cedo'],
  ['vai', 'desenhar', 'gato', 'preto', 'rápido'], ['vai', 'assistir', 'filme', 'longo', 'sozinho'],
  ['vamos', 'ajudar', 'vizinho', 'idoso', 'agora'],
];

async function clickWord(frame, word) {
  await frame.locator('.word-btn', { hasText: new RegExp(`^${word}$`) }).click();
}

async function solveSequence(frame, words) {
  for (const word of words) await clickWord(frame, word);
}

// Pula direto as 2 primeiras atividades (já todas respondidas) pra abrir
// a 3ª — mesmo padrão de tests/frases-avancado-engel.spec.js.
async function openJogoNivel3(page, seed = {}) {
  await stubSupabaseFake(page, seed);
  await page.addInitScript(u => {
    const todasIds = Array.from({ length: 15 }, (_, i) => i + 1);
    localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(todasIds));
    localStorage.setItem(`frases_engel_avancado_progress_${u}`, JSON.stringify(todasIds));
  }, 'engel.fraga');
  await page.goto(ENGEL_URL);
  await page.click('.game-card:has-text("Comunicação (Engel)")');
  await page.click('#moduleSelector_frases-engel .game-card:has-text("Nível 3")');
  const frame = page.frameLocator('#moduleFrame_frases-engel');
  await frame.locator('#btnIniciar').click();
  return frame;
}

test.describe('Trilha "Formar Frases" — 3ª atividade trava até concluir a 2ª (Avançado)', () => {
  test('aparece na lista, travada, com os 3 módulos em ordem', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await expect(page.locator('#moduleSelector_frases-engel')).toContainText('Formar Frases — Associação de Palavras');
    await expect(page.locator('#moduleSelector_frases-engel')).toContainText('Formar Frases — Avançado');
    await expect(page.locator('#moduleSelector_frases-engel')).toContainText('Formar Frases — Nível 3');
    await expect(page.locator('#moduleSelector_frases-engel .game-card.locked', { hasText: 'Nível 3' })).toHaveCount(1);
  });

  test('concluindo só a 1ª atividade, a 3ª continua travada', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(Array.from({ length: 15 }, (_, i) => i + 1)));
    }, 'engel.fraga');
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await expect(page.locator('#moduleSelector_frases-engel .game-card.locked', { hasText: 'Nível 3' })).toHaveCount(1);
  });

  test('concluindo a 1ª e a 2ª, a 3ª destrava', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      const todasIds = Array.from({ length: 15 }, (_, i) => i + 1);
      localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(todasIds));
      localStorage.setItem(`frases_engel_avancado_progress_${u}`, JSON.stringify(todasIds));
    }, 'engel.fraga');
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await expect(page.locator('#moduleSelector_frases-engel .game-card.locked', { hasText: 'Nível 3' })).toHaveCount(0);
  });
});

test.describe('Jogo "Formar Frases — Nível 3 (Engel)"', () => {
  test('mostra a tela de regras explicando o nível mais difícil', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      const todasIds = Array.from({ length: 15 }, (_, i) => i + 1);
      localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(todasIds));
      localStorage.setItem(`frases_engel_avancado_progress_${u}`, JSON.stringify(todasIds));
    }, 'engel.fraga');
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await page.click('#moduleSelector_frases-engel .game-card:has-text("Nível 3")');
    const frame = page.frameLocator('#moduleFrame_frases-engel');

    await expect(frame.locator('#gateWrap')).toContainText('5');
    await expect(frame.locator('#stageWrap')).toBeHidden();
  });

  test('nível 1 exige 3 palavras em ordem, com a pista revelada uma de cada vez', async ({ page }) => {
    const frame = await openJogoNivel3(page);
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · 3 palavras (na ordem certa)');
    await expect(frame.locator('.clue-row .clue.pending')).toHaveCount(2);
    await expect(frame.locator('.clue-row .clue.active')).toHaveText('🥣');

    await clickWord(frame, 'tomar');
    await expect(frame.locator('#sentenceBox .filled').first()).toHaveText('tomar');
    await expect(frame.locator('.clue-row .clue.active')).toHaveText('🍲');
    await expect(frame.locator('.clue-row .clue.pending')).toHaveCount(1);
    await expect(frame.locator('#btnNext')).toBeHidden();
  });

  test('errar a 1ª palavra trava a frase inteira na hora', async ({ page }) => {
    const frame = await openJogoNivel3(page);
    await clickWord(frame, 'comer'); // distratora do desafio 1
    await expect(frame.locator('#feedback')).toContainText('Não foi dessa vez');
    await expect(frame.locator('.word-btn', { hasText: 'comer' })).toHaveClass(/wrong-pick/);

    const buttons = frame.locator('.word-btn');
    await expect(buttons).toHaveCount(5); // 3 certas + 2 distratoras, nível 1
    for (let i = 0; i < 5; i++) await expect(buttons.nth(i)).toBeDisabled();

    await expect(frame.locator('#btnNext')).toBeVisible();
    await expect(frame.locator('.step-icon').first()).toHaveClass(/wrong/);
  });

  test('acertar as 3 palavras em ordem completa a frase e libera a próxima', async ({ page }) => {
    const frame = await openJogoNivel3(page);
    await solveSequence(frame, ANSWERS[0]);
    await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
    await expect(frame.locator('#sentenceBox .filled')).toHaveCount(3);
    await expect(frame.locator('.step-icon').first()).toHaveClass(/completed/);

    await frame.locator('#btnNext').click();
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · 3 palavras (na ordem certa)');
  });

  test('nível 3 exige 5 palavras em ordem, com 3 distratoras no pool', async ({ page }) => {
    const frame = await openJogoNivel3(page);
    for (let i = 0; i < 10; i++) {
      await solveSequence(frame, ANSWERS[i]);
      await frame.locator('#btnNext').click();
    }
    await expect(frame.locator('#levelTag')).toHaveText('Nível 3 · 5 palavras (na ordem certa)');
    await expect(frame.locator('.word-btn')).toHaveCount(8); // 5 certas + 3 distratoras
    await solveSequence(frame, ANSWERS[10]);
    await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
    await expect(frame.locator('#sentenceBox .filled')).toHaveCount(5);
  });

  test('resolve as 15 frases (errando de propósito a 1ª) e mostra o placar no troféu final', async ({ page }) => {
    const frame = await openJogoNivel3(page);

    await clickWord(frame, 'comer'); // erro proposital na frase 1
    await frame.locator('#btnNext').click();

    for (let i = 1; i < ANSWERS.length; i++) {
      await solveSequence(frame, ANSWERS[i]);
      if (i < ANSWERS.length - 1) await frame.locator('#btnNext').click();
    }

    await expect(frame.locator('.trophy-box')).toContainText('Terminou tudo!');
    await expect(frame.locator('.trophy-box')).toContainText('Você acertou 14 de 15 sozinho.');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`frases_engel_nivel3_progress_${u}`)), 'engel.fraga');
    expect(progress).toHaveLength(15);
    const results = await page.evaluate(u => JSON.parse(localStorage.getItem(`frases_engel_nivel3_results_${u}`)), 'engel.fraga');
    expect(results['1']).toBe('wrong');
    expect(results['2']).toBe('correct');
  });

  test('botão "Pular (professor)" preenche a frase inteira de uma vez', async ({ page }) => {
    const frame = await openJogoNivel3(page, SEED_PROFESSOR);

    await frame.locator('#btnSkip').click();
    await frame.locator('#skipToken').fill(TOKEN_VALIDO);
    await frame.locator('#btnConfirmSkip').click();

    await expect(frame.locator('#feedback')).toContainText('Pulado pelo professor');
    await expect(frame.locator('#sentenceBox .filled')).toHaveCount(3);
    await expect(frame.locator('#btnNext')).toBeVisible();
  });

  test('gabarito lista as 15 frases com a resposta completa', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/atividades/frases-nivel3-engel.html?user=admin&role=professor&turma=jogos');

    const download = await gerarGabaritoFlutuante(page);
    expect(download.suggestedFilename()).toBe('frases-nivel3-engel-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('Eu vou tomar sopa quente');
    expect(content).toContain('Hoje nós vamos ajudar vizinho idoso agora');
  });
});

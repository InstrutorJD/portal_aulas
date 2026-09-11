// @ts-check
// 4ª atividade de "Formar Frases (Engel)" — mesma trilha de
// atividades/frases-engel.html, frases-avancado-engel.html e
// frases-nivel3-engel.html (matéria dedicada "Comunicação (Engel)", ver
// tests/frases-engel.spec.js pros testes de visibilidade do card), travada
// até concluir a 3ª (Nível 3). Muda a mecânica: em vez de clicar a palavra
// certa numa lista, o aluno DIGITA a palavra que falta num campo de texto —
// de 1 palavra (nível 1) até 4 (nível 4).
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
// atividades/frases-digitar-engel.html.
const ANSWERS = [
  ['dormir'], ['correr'], ['brincar'], ['cantar'],
  ['comer', 'maçã'], ['lavar', 'mão'], ['escovar', 'dente'], ['beber', 'água'],
  ['tomar', 'sopa', 'quente'], ['comprar', 'sapato', 'novo'], ['vai', 'ler', 'livro'], ['vai', 'pintar', 'quadro'],
  ['vou', 'lavar', 'roupa', 'suja'], ['vamos', 'visitar', 'vovó', 'querida'], ['vai', 'ajudar', 'vizinho', 'idoso'],
];

async function typeWord(frame, word) {
  await frame.locator('#wordInput').fill(word);
  await frame.locator('#btnConfirmWord').click();
}

async function solveSequence(frame, words) {
  for (const word of words) await typeWord(frame, word);
}

// Pula direto as 3 primeiras atividades (já todas respondidas) pra abrir a
// 4ª — mesmo padrão de tests/frases-nivel3-engel.spec.js.
async function openJogoDigitar(page, seed = {}) {
  await stubSupabaseFake(page, seed);
  await page.addInitScript(u => {
    const todasIds = Array.from({ length: 15 }, (_, i) => i + 1);
    localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(todasIds));
    localStorage.setItem(`frases_engel_avancado_progress_${u}`, JSON.stringify(todasIds));
    localStorage.setItem(`frases_engel_nivel3_progress_${u}`, JSON.stringify(todasIds));
  }, 'engel.fraga');
  await page.goto(ENGEL_URL);
  await page.click('.game-card:has-text("Comunicação (Engel)")');
  await page.click('#moduleSelector_frases-engel .game-card:has-text("Digitando")');
  const frame = page.frameLocator('#moduleFrame_frases-engel');
  await frame.locator('#btnIniciar').click();
  return frame;
}

test.describe('Trilha "Formar Frases" — 4ª atividade trava até concluir a 3ª (Nível 3)', () => {
  test('aparece na lista, travada, com os 4 módulos em ordem', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await expect(page.locator('#moduleSelector_frases-engel')).toContainText('Formar Frases — Associação de Palavras');
    await expect(page.locator('#moduleSelector_frases-engel')).toContainText('Formar Frases — Avançado');
    await expect(page.locator('#moduleSelector_frases-engel')).toContainText('Formar Frases — Nível 3');
    await expect(page.locator('#moduleSelector_frases-engel')).toContainText('Formar Frases — Digitando');
    await expect(page.locator('#moduleSelector_frases-engel .game-card.locked', { hasText: 'Digitando' })).toHaveCount(1);
  });

  test('concluindo só até o Nível 3, a Digitando continua travada', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      const todasIds = Array.from({ length: 15 }, (_, i) => i + 1);
      localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(todasIds));
      localStorage.setItem(`frases_engel_avancado_progress_${u}`, JSON.stringify(todasIds));
    }, 'engel.fraga');
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await expect(page.locator('#moduleSelector_frases-engel .game-card.locked', { hasText: 'Digitando' })).toHaveCount(1);
  });

  test('concluindo as 3 primeiras, a Digitando destrava', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      const todasIds = Array.from({ length: 15 }, (_, i) => i + 1);
      localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(todasIds));
      localStorage.setItem(`frases_engel_avancado_progress_${u}`, JSON.stringify(todasIds));
      localStorage.setItem(`frases_engel_nivel3_progress_${u}`, JSON.stringify(todasIds));
    }, 'engel.fraga');
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await expect(page.locator('#moduleSelector_frases-engel .game-card.locked', { hasText: 'Digitando' })).toHaveCount(0);
  });
});

test.describe('Jogo "Formar Frases — Digitando (Engel)"', () => {
  test('mostra a tela de regras explicando que agora é pra digitar', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      const todasIds = Array.from({ length: 15 }, (_, i) => i + 1);
      localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(todasIds));
      localStorage.setItem(`frases_engel_avancado_progress_${u}`, JSON.stringify(todasIds));
      localStorage.setItem(`frases_engel_nivel3_progress_${u}`, JSON.stringify(todasIds));
    }, 'engel.fraga');
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await page.click('#moduleSelector_frases-engel .game-card:has-text("Digitando")');
    const frame = page.frameLocator('#moduleFrame_frases-engel');

    await expect(frame.locator('#gateWrap')).toContainText('digita');
    await expect(frame.locator('#stageWrap')).toBeHidden();
  });

  test('nível 1 exige digitar 1 palavra', async ({ page }) => {
    const frame = await openJogoDigitar(page);
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · 1 palavra digitada');
    await expect(frame.locator('.clue-row .clue.active')).toHaveText('😴');
    await expect(frame.locator('.clue-row .clue.pending')).toHaveCount(0);

    await typeWord(frame, 'dormir');
    await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
    await expect(frame.locator('#sentenceBox .filled')).toHaveText('dormir');
  });

  test('botão de Dica mostra a 1ª letra da palavra atual e some na próxima', async ({ page }) => {
    const frame = await openJogoDigitar(page);
    await expect(frame.locator('#hintText')).toHaveText('');

    await frame.locator('#btnHint').click();
    await expect(frame.locator('#hintText')).toContainText('"D"'); // "dormir"

    // Some ao avançar pra próxima frase (nova palavra).
    await typeWord(frame, 'dormir');
    await frame.locator('#btnNext').click();
    await expect(frame.locator('#hintText')).toHaveText('');
  });

  test('ignora acento e maiúscula/minúscula na comparação', async ({ page }) => {
    const frame = await openJogoDigitar(page);
    for (let i = 0; i < 8; i++) {
      await solveSequence(frame, ANSWERS[i]);
      await frame.locator('#btnNext').click();
    }
    // Frase 9 ("...tomar sopa quente") — digita com acento/maiúscula trocados.
    await typeWord(frame, 'TOMAR');
    await typeWord(frame, 'Sopa');
    await typeWord(frame, 'quênte');
    await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
    await expect(frame.locator('#sentenceBox .filled')).toHaveCount(3);
  });

  test('errar a 1ª palavra trava a frase inteira na hora', async ({ page }) => {
    const frame = await openJogoDigitar(page);
    await typeWord(frame, 'acordar'); // errada pra frase 1 ("dormir")
    await expect(frame.locator('#feedback')).toContainText('Não foi dessa vez');
    await expect(frame.locator('#wordInput')).toBeDisabled();
    await expect(frame.locator('#btnConfirmWord')).toBeDisabled();

    await expect(frame.locator('#btnNext')).toBeVisible();
    await expect(frame.locator('.step-icon').first()).toHaveClass(/wrong/);
    await expect(frame.locator('#btnHint')).toBeDisabled();
  });

  test('acertar as palavras em ordem completa a frase e libera a próxima', async ({ page }) => {
    const frame = await openJogoDigitar(page);
    await solveSequence(frame, ANSWERS[0]);
    await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
    await expect(frame.locator('.step-icon').first()).toHaveClass(/completed/);

    await frame.locator('#btnNext').click();
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · 1 palavra digitada');
  });

  test('nível 4 exige digitar 4 palavras em ordem', async ({ page }) => {
    const frame = await openJogoDigitar(page);
    for (let i = 0; i < 12; i++) {
      await solveSequence(frame, ANSWERS[i]);
      await frame.locator('#btnNext').click();
    }
    await expect(frame.locator('#levelTag')).toHaveText('Nível 4 · 4 palavras digitadas');
    await solveSequence(frame, ANSWERS[12]);
    await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
    await expect(frame.locator('#sentenceBox .filled')).toHaveCount(4);
  });

  test('resolve as 15 frases (errando de propósito a 1ª) e mostra o placar no troféu final', async ({ page }) => {
    const frame = await openJogoDigitar(page);

    await typeWord(frame, 'acordar'); // erro proposital na frase 1
    await frame.locator('#btnNext').click();

    for (let i = 1; i < ANSWERS.length; i++) {
      await solveSequence(frame, ANSWERS[i]);
      if (i < ANSWERS.length - 1) await frame.locator('#btnNext').click();
    }

    await expect(frame.locator('.trophy-box')).toContainText('Terminou tudo!');
    await expect(frame.locator('.trophy-box')).toContainText('Você acertou 14 de 15 sozinho.');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`frases_engel_digitar_progress_${u}`)), 'engel.fraga');
    expect(progress).toHaveLength(15);
    const results = await page.evaluate(u => JSON.parse(localStorage.getItem(`frases_engel_digitar_results_${u}`)), 'engel.fraga');
    expect(results['1']).toBe('wrong');
    expect(results['2']).toBe('correct');
  });

  test('botão "Pular (professor)" preenche a frase inteira de uma vez', async ({ page }) => {
    const frame = await openJogoDigitar(page, SEED_PROFESSOR);

    await frame.locator('#btnSkip').click();
    await frame.locator('#skipToken').fill(TOKEN_VALIDO);
    await frame.locator('#btnConfirmSkip').click();

    await expect(frame.locator('#feedback')).toContainText('Pulado pelo professor');
    await expect(frame.locator('#sentenceBox .filled')).toHaveCount(1);
    await expect(frame.locator('#btnNext')).toBeVisible();
  });

  test('gabarito lista as 15 frases com a resposta completa', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/atividades/frases-digitar-engel.html?user=admin&role=professor&turma=jogos');

    const download = await gerarGabaritoFlutuante(page);
    expect(download.suggestedFilename()).toBe('frases-digitar-engel-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('Eu vou dormir');
    expect(content).toContain('Hoje ela vai ajudar vizinho idoso');
  });
});

// @ts-check
// Jogo individual "Formar Frases (Engel)" — matéria DEDICADA e inteira
// restrita a um único aluno (materia.visibleFor, não só trilha.visibleFor
// como as outras adaptações do Engel) — ver isMateriaVisibleToEmail em
// shared/platform-core.js. Cobre o ponto mais sensível: o CARD da matéria
// não pode vazar (nem vazio/"Em breve") pra quem não é o Engel nem o
// professor; o jogo em si só dá 1 tentativa por frase (sem chute repetido);
// e a trava de tela (shared/exam-proctor.js) bloqueia depois de sair da
// aba 2 vezes, só o professor libera com token.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, expandGabaritoRow } = require('./helpers');

const PROFESSOR_URL = '/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos';
const ENGEL_URL = '/turmas/jogos/plataforma.html?user=engel.fraga&ip=192.168.1.20&saldo=1000.00&role=aluno&turma=jogos';
const BRENO_URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos';

const TOKEN_VALIDO = '482913';
const SEED_PROFESSOR = {
  profiles: [
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
  professor_tokens: [
    { token: TOKEN_VALIDO, created_by: 'fake-admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  ],
};

async function simulateTabHidden(frame) {
  await frame.locator('body').evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

// Abre o jogo e já clica "Começar" (trava de tela armada) — a maioria dos
// testes quer chegar direto na 1ª frase, não na tela de regras em si (essa
// tem teste próprio).
async function openJogo(page) {
  await page.goto(ENGEL_URL);
  await page.click('.game-card:has-text("Comunicação (Engel)")');
  await page.click('#moduleSelector_frases-engel .game-card');
  const frame = page.frameLocator('#moduleFrame_frases-engel');
  await frame.locator('#btnIniciar').click();
  return frame;
}

test.describe('Matéria "Comunicação (Engel)" — visibilidade do card', () => {
  test('professor vê o card da matéria', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(PROFESSOR_URL);
    await expect(page.locator('#materiaCardGrid')).toContainText('Comunicação (Engel)');
  });

  test('engel.fraga vê o card da matéria', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await expect(page.locator('#materiaCardGrid')).toContainText('Comunicação (Engel)');
  });

  test('outro aluno não vê o card da matéria (nem vazio/"Em breve")', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(BRENO_URL);
    await expect(page.locator('#materiaCardGrid')).not.toContainText('Comunicação (Engel)');
    // regressão: continua vendo as mesmas 7 matérias de sempre, não 8.
    await expect(page.locator('#materiaCardGrid .game-card')).toHaveCount(7);
  });

  test('outro aluno também não vê a matéria na aba Perfil', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(BRENO_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="perfil"]');
    await expect(page.locator('#tabContentPerfil')).not.toContainText('Comunicação (Engel)');
  });
});

test.describe('Jogo "Formar Frases (Engel)"', () => {
  test('mostra a tela de regras antes de começar, não o jogo direto', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await page.click('#moduleSelector_frases-engel .game-card');
    const frame = page.frameLocator('#moduleFrame_frases-engel');

    await expect(frame.locator('#gateWrap')).toContainText('Antes de começar');
    await expect(frame.locator('#stageWrap')).toBeHidden();
    await expect(frame.locator('#btnIniciar')).toBeVisible();
  });

  test('carrega travado a partir da 2ª frase, com a 1ª (nível 1, 2 palavras) já disponível', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · 2 palavras');
    await expect(frame.locator('#clueEmoji')).toHaveText('☀️');
    await expect(frame.locator('#sentenceBox')).toContainText('Bom');
    await expect(frame.locator('.word-btn')).toHaveCount(3);
    await expect(frame.locator('.step-icon').nth(1)).toHaveClass(/locked/);
  });

  test('clicar a palavra errada trava a resposta na hora (sem chute repetido) e libera a próxima', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);

    await frame.locator('.word-btn', { hasText: 'Carro' }).click();
    await expect(frame.locator('#feedback')).toContainText('Não foi dessa vez');
    await expect(frame.locator('.word-btn', { hasText: 'Carro' })).toHaveClass(/wrong-pick/);

    // as 3 opções ficam desabilitadas — não dá pra tentar de novo.
    const buttons = frame.locator('.word-btn');
    await expect(buttons).toHaveCount(3);
    for (let i = 0; i < 3; i++) await expect(buttons.nth(i)).toBeDisabled();

    // mesmo errando, a frase conta como respondida: destrava a próxima e
    // aparece "Próxima" (não fica travado esperando acertar).
    await expect(frame.locator('#btnNext')).toBeVisible();
    await expect(frame.locator('.step-icon').first()).toHaveClass(/completed/);
    await expect(frame.locator('.step-icon').first()).toHaveClass(/wrong/);
    await expect(frame.locator('.step-icon').first()).toContainText('❌');

    await frame.locator('#btnNext').click();
    await expect(frame.locator('#clueEmoji')).toHaveText('🌙');
  });

  test('clicar a palavra certa completa a frase, marca concluída e libera a próxima', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);
    await frame.locator('.word-btn', { hasText: 'Dia' }).click();
    await expect(frame.locator('#sentenceBox .filled')).toHaveText('Dia');
    await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
    await expect(frame.locator('#btnNext')).toBeVisible();
    await expect(frame.locator('.step-icon').first()).toHaveClass(/completed/);
    await expect(frame.locator('.step-icon').first()).toContainText('✅');

    await frame.locator('#btnNext').click();
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · 2 palavras');
    await expect(frame.locator('#clueEmoji')).toHaveText('🌙');
  });

  test('resolve as 15 frases em ordem (2 → 3 → 4 palavras), errando de propósito 1, e mostra o placar no troféu final', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);

    // Frase 1 errada de propósito (Carro em vez de Dia) — ainda assim avança.
    await frame.locator('.word-btn', { hasText: 'Carro' }).click();
    await expect(frame.locator('#feedback')).toContainText('Não foi dessa vez');
    await frame.locator('#btnNext').click();

    const answers = ['Noite', 'Bem', 'Cachorro', 'Casa', 'Água', 'Gato', 'Bola', 'Amigos', 'Quente', 'Dormindo', 'Desenhando', 'Maçã', 'Bola', 'Festa'];
    for (let i = 0; i < answers.length; i++) {
      await frame.locator('.word-btn', { hasText: new RegExp(`^${answers[i]}$`) }).click();
      await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
      if (i < answers.length - 1) await frame.locator('#btnNext').click();
    }

    await expect(frame.locator('.trophy-box')).toContainText('Terminou tudo!');
    await expect(frame.locator('.trophy-box')).toContainText('Você acertou 14 de 15 sozinho.');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`frases_engel_progress_${u}`)), 'engel.fraga');
    expect(progress).toHaveLength(15);
    const results = await page.evaluate(u => JSON.parse(localStorage.getItem(`frases_engel_results_${u}`)), 'engel.fraga');
    expect(results['1']).toBe('wrong');
    expect(results['2']).toBe('correct');
  });

  test('botão "Pular (professor)" exige token válido antes de pular a frase', async ({ page }) => {
    await stubSupabaseFake(page, SEED_PROFESSOR);
    const frame = await openJogo(page);

    await frame.locator('#btnSkip').click();
    await expect(frame.locator('#skipForm')).toBeVisible();
    await frame.locator('#skipToken').fill('000000');
    await frame.locator('#btnConfirmSkip').click();
    await expect(frame.locator('#skipMsg')).toContainText('inválido ou expirado');
    await expect(frame.locator('#btnNext')).toBeHidden();

    await frame.locator('#skipToken').fill(TOKEN_VALIDO);
    await frame.locator('#btnConfirmSkip').click();
    await expect(frame.locator('#feedback')).toContainText('Pulado pelo professor');
    await expect(frame.locator('#btnNext')).toBeVisible();
  });

  test('gabarito lista as 15 frases com a resposta completa', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(PROFESSOR_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = await expandGabaritoRow(page, 'Formar Frases');
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('frases-engel-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('Bom Dia');
    expect(content).toContain('Amanhã vai ter Festa');
  });
});

test.describe('Jogo "Formar Frases (Engel)" — trava de tela', () => {
  test('1ª saída da aba avisa, 2ª bloqueia — e o professor desbloqueia com o token', async ({ page }) => {
    await stubSupabaseFake(page, SEED_PROFESSOR);
    const frame = await openJogo(page);
    await expect(frame.locator('#stageWrap')).toBeVisible();

    // 1ª saída: aviso, o jogo continua acessível por baixo do overlay.
    await simulateTabHidden(frame);
    await expect(frame.locator('.warn-overlay')).toContainText('Aviso 1/2');
    await frame.locator('#btnWarnOk').click();
    await expect(frame.locator('.warn-overlay')).toHaveCount(0);
    await expect(frame.locator('#stageWrap')).toBeVisible();

    // 2ª saída: bloqueia de verdade — o jogo some, entra a tela de bloqueio.
    await simulateTabHidden(frame);
    await expect(frame.locator('#gateWrap')).toContainText('Jogo bloqueado');
    await expect(frame.locator('#stageWrap')).toBeHidden();

    const blockedState = await page.evaluate(u => JSON.parse(localStorage.getItem(`frases_engel_guard_${u}`)), 'engel.fraga');
    expect(blockedState.blocked).toBe(true);

    // Sem o token do professor não sai da tela de bloqueio.
    await frame.locator('#unlockToken').fill('000000');
    await frame.locator('#btnUnlock').click();
    await expect(frame.locator('#gateWrap')).toContainText('Jogo bloqueado');

    // Com o token certo, volta pra tela de regras (não direto pro jogo) e zera os avisos.
    await frame.locator('#unlockToken').fill(TOKEN_VALIDO);
    await frame.locator('#btnUnlock').click();
    await expect(frame.locator('#gateWrap')).toContainText('Antes de começar');
    const unlockedState = await page.evaluate(u => JSON.parse(localStorage.getItem(`frases_engel_guard_${u}`)), 'engel.fraga');
    expect(unlockedState.blocked).toBe(false);
    expect(unlockedState.warnings).toBe(0);
  });

  test('depois de responder as 15 frases, o jogo abre direto no troféu (sem tela de regras) e sair da aba não conta mais aviso', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      const todasIds = Array.from({ length: 15 }, (_, i) => i + 1);
      localStorage.setItem(`frases_engel_progress_${u}`, JSON.stringify(todasIds));
    }, 'engel.fraga');

    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await page.click('#moduleSelector_frases-engel .game-card');
    const frame = page.frameLocator('#moduleFrame_frases-engel');

    // já respondeu tudo — não há mais risco de cola, então nem passa pela
    // tela de regras: o troféu já aparece direto.
    await expect(frame.locator('.trophy-box')).toContainText('Terminou tudo!');

    await simulateTabHidden(frame);
    await expect(frame.locator('.warn-overlay')).toHaveCount(0);
  });

  test('professor abre o jogo direto, sem tela de regras nem risco de bloqueio', async ({ page }) => {
    // A URL do iframe do módulo não carrega "role=" (só user/name/turma —
    // ver openModule em shared/platform-core.js) — sem um profile
    // 'admin'/professor já semeado, o cliente fake sintetizaria 'aluno'
    // por padrão pra esse id dentro do iframe. Mesmo motivo de
    // tests/professor-unlock-challenges.spec.js sempre semear isso.
    await stubSupabaseFake(page, SEED_PROFESSOR);
    await page.goto(PROFESSOR_URL);
    await page.click('.game-card:has-text("Comunicação (Engel)")');
    await page.click('#moduleSelector_frases-engel .game-card');
    const frame = page.frameLocator('#moduleFrame_frases-engel');

    await expect(frame.locator('#stageWrap')).toBeVisible();
    await expect(frame.locator('#gateWrap')).not.toContainText('Antes de começar');
  });
});

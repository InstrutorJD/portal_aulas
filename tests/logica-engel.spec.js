// @ts-check
// Jogo individual "Lógica — Qual é o Próximo? (Engel)" — trilha
// 'logica-adaptado-engel' dentro da matéria compartilhada "Fundamentos de
// Programação de Jogos" (visibilidade coberta em
// tests/trilha-individual-engel.spec.js). Cobre o jogo em si: 15
// quebra-cabeças de correlação (3 itens em emoji+palavra, escolha entre 4
// opções qual continua o padrão), só 1 tentativa por quebra-cabeça (sem
// chute repetido), e a trava de tela (shared/exam-proctor.js) — mesmo
// padrão de tests/frases-engel.spec.js.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, gerarGabaritoFlutuante } = require('./helpers');

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

async function simulateTabHidden(frame) {
  await frame.locator('body').evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

// Abre o jogo e já clica "Começar" (trava de tela armada) — a maioria dos
// testes quer chegar direto no 1º quebra-cabeça, não na tela de regras
// (essa tem teste próprio).
async function openJogo(page) {
  await page.goto(ENGEL_URL);
  await page.click('.game-card:has-text("Fundamentos de Programação")');
  await page.selectOption('#trilhaSelect', 'logica-adaptado-engel');
  await page.click('#moduleSelector_logica-adaptado-engel .game-card');
  const frame = page.frameLocator('#moduleFrame_logica-adaptado-engel');
  await frame.locator('#btnIniciar').click();
  return frame;
}

test.describe('Jogo "Lógica — Qual é o Próximo? (Engel)"', () => {
  test('mostra a tela de regras antes de começar, não o jogo direto', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Fundamentos de Programação")');
    await page.selectOption('#trilhaSelect', 'logica-adaptado-engel');
    await page.click('#moduleSelector_logica-adaptado-engel .game-card');
    const frame = page.frameLocator('#moduleFrame_logica-adaptado-engel');

    await expect(frame.locator('#gateWrap')).toContainText('Antes de começar');
    await expect(frame.locator('#stageWrap')).toBeHidden();
    await expect(frame.locator('#btnIniciar')).toBeVisible();
  });

  test('carrega travado a partir do 2º quebra-cabeça, com o 1º (nível 1) já disponível', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · Mesmo grupo');
    await expect(frame.locator('.pattern-chip')).toHaveCount(4); // 3 itens + a incógnita (❓)
    await expect(frame.locator('.pattern-chip').first()).toContainText('Maçã');
    await expect(frame.locator('.word-btn')).toHaveCount(4);
    await expect(frame.locator('.step-icon').nth(1)).toHaveClass(/locked/);
  });

  test('clicar a opção errada trava a resposta na hora (sem chute repetido) e libera a próxima', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);

    await frame.locator('.word-btn', { hasText: 'Cachorro' }).click();
    await expect(frame.locator('#feedback')).toContainText('Não foi dessa vez');
    await expect(frame.locator('.word-btn', { hasText: 'Cachorro' })).toHaveClass(/wrong-pick/);

    // as 4 opções ficam desabilitadas — não dá pra tentar de novo.
    const buttons = frame.locator('.word-btn');
    await expect(buttons).toHaveCount(4);
    for (let i = 0; i < 4; i++) await expect(buttons.nth(i)).toBeDisabled();

    // mesmo errando, conta como respondido: destrava o próximo e aparece "Próxima".
    await expect(frame.locator('#btnNext')).toBeVisible();
    await expect(frame.locator('.step-icon').first()).toHaveClass(/completed/);
    await expect(frame.locator('.step-icon').first()).toHaveClass(/wrong/);
    await expect(frame.locator('.step-icon').first()).toContainText('❌');

    await frame.locator('#btnNext').click();
    await expect(frame.locator('.pattern-chip').first()).toContainText('Cachorro');
  });

  test('clicar a opção certa completa o padrão, marca concluído e libera o próximo', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);
    await frame.locator('.word-btn', { hasText: 'Laranja' }).click();
    // A incógnita (última chip) passa a mostrar a resposta escolhida.
    await expect(frame.locator('.pattern-chip').last()).toContainText('Laranja');
    await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
    await expect(frame.locator('#btnNext')).toBeVisible();
    await expect(frame.locator('.step-icon').first()).toHaveClass(/completed/);
    await expect(frame.locator('.step-icon').first()).toContainText('✅');

    await frame.locator('#btnNext').click();
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · Mesmo grupo');
    await expect(frame.locator('.pattern-chip').first()).toContainText('Cachorro');
  });

  test('resolve os 15 quebra-cabeças em ordem (nível 1 → 2 → 3), errando de propósito 1, e mostra o placar no troféu final', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);

    // 1º errado de propósito (Cachorro em vez de Laranja) — ainda assim avança.
    await frame.locator('.word-btn', { hasText: 'Cachorro' }).click();
    await expect(frame.locator('#feedback')).toContainText('Não foi dessa vez');
    await frame.locator('#btnNext').click();

    const answers = [
      'Cavalo', 'Ônibus', 'Verde', 'Tênis', // nível 1 (2-5)
      '4 estrelas', '4 maçãs', 'Quatro', '4 pintinhos', '4 gols', // nível 2 (6-10)
      'Beisebol', 'Coelho', 'Melancia', 'Gorila', 'Cadeira', // nível 3 (11-15)
    ];
    for (let i = 0; i < answers.length; i++) {
      await frame.locator('.word-btn', { hasText: answers[i] }).click();
      await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
      if (i < answers.length - 1) await frame.locator('#btnNext').click();
    }

    await expect(frame.locator('.trophy-box')).toContainText('Terminou tudo!');
    await expect(frame.locator('.trophy-box')).toContainText('Você acertou 14 de 15 sozinho.');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`logica_engel_progress_${u}`)), 'engel.fraga');
    expect(progress).toHaveLength(15);
    const results = await page.evaluate(u => JSON.parse(localStorage.getItem(`logica_engel_results_${u}`)), 'engel.fraga');
    expect(results['1']).toBe('wrong');
    expect(results['2']).toBe('correct');
  });

  test('botão "Pular (professor)" exige token válido antes de pular o quebra-cabeça', async ({ page }) => {
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

  test('gabarito lista os 15 quebra-cabeças com a resposta completa', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/atividades/logica-engel.html?user=admin&role=professor&turma=jogos');

    const download = await gerarGabaritoFlutuante(page);
    expect(download.suggestedFilename()).toBe('logica-engel-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('🍊 Laranja');
    expect(content).toContain('⚾ Beisebol');
  });
});

test.describe('Jogo "Lógica — Qual é o Próximo? (Engel)" — trava de tela', () => {
  test('1ª saída da aba avisa, 2ª bloqueia — e o professor desbloqueia com o token', async ({ page }) => {
    await stubSupabaseFake(page, SEED_PROFESSOR);
    const frame = await openJogo(page);
    await expect(frame.locator('#stageWrap')).toBeVisible();

    await simulateTabHidden(frame);
    await expect(frame.locator('.warn-overlay')).toContainText('Aviso 1/2');
    await frame.locator('#btnWarnOk').click();
    await expect(frame.locator('.warn-overlay')).toHaveCount(0);
    await expect(frame.locator('#stageWrap')).toBeVisible();

    await simulateTabHidden(frame);
    await expect(frame.locator('#gateWrap')).toContainText('Jogo bloqueado');
    await expect(frame.locator('#stageWrap')).toBeHidden();

    const blockedState = await page.evaluate(u => JSON.parse(localStorage.getItem(`logica_engel_guard_${u}`)), 'engel.fraga');
    expect(blockedState.blocked).toBe(true);

    await frame.locator('#unlockToken').fill('000000');
    await frame.locator('#btnUnlock').click();
    await expect(frame.locator('#gateWrap')).toContainText('Jogo bloqueado');

    await frame.locator('#unlockToken').fill(TOKEN_VALIDO);
    await frame.locator('#btnUnlock').click();
    await expect(frame.locator('#gateWrap')).toContainText('Antes de começar');
    const unlockedState = await page.evaluate(u => JSON.parse(localStorage.getItem(`logica_engel_guard_${u}`)), 'engel.fraga');
    expect(unlockedState.blocked).toBe(false);
    expect(unlockedState.warnings).toBe(0);
  });

  test('depois de responder os 15 quebra-cabeças, o jogo abre direto no troféu (sem tela de regras) e sair da aba não conta mais aviso', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      const todasIds = Array.from({ length: 15 }, (_, i) => i + 1);
      localStorage.setItem(`logica_engel_progress_${u}`, JSON.stringify(todasIds));
    }, 'engel.fraga');

    await page.goto(ENGEL_URL);
    await page.click('.game-card:has-text("Fundamentos de Programação")');
    await page.selectOption('#trilhaSelect', 'logica-adaptado-engel');
    await page.click('#moduleSelector_logica-adaptado-engel .game-card');
    const frame = page.frameLocator('#moduleFrame_logica-adaptado-engel');

    await expect(frame.locator('.trophy-box')).toContainText('Terminou tudo!');

    await simulateTabHidden(frame);
    await expect(frame.locator('.warn-overlay')).toHaveCount(0);
  });

  test('professor abre o jogo direto, sem tela de regras nem risco de bloqueio', async ({ page }) => {
    await stubSupabaseFake(page, SEED_PROFESSOR);
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos');
    await page.click('.game-card:has-text("Fundamentos de Programação")');
    await page.selectOption('#trilhaSelect', 'logica-adaptado-engel');
    await page.click('#moduleSelector_logica-adaptado-engel .game-card');
    const frame = page.frameLocator('#moduleFrame_logica-adaptado-engel');

    await expect(frame.locator('#stageWrap')).toBeVisible();
    await expect(frame.locator('#gateWrap')).not.toContainText('Antes de começar');
  });
});

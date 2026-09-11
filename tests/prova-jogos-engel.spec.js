// @ts-check
// "Prova Diagnóstica (Engel)" — trilha individual, visível só pro Engel
// (matéria Prova, turma Jogos Digitais). Diferente da prova padrão
// (prova-jogos.html: banco de 76, sorteio de 20, 5 alternativas), usa uma
// lista curta e fixa de 15 perguntas com só 3 alternativas cada — mas
// com a MESMA trava de integridade (shared/exam-proctor.js: 1ª saída da
// aba avisa, 2ª bloqueia até o professor liberar com token) da prova
// padrão e das outras atividades avaliativas do Engel (frases-engel.html
// e afins).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, gerarGabaritoFlutuante } = require('./helpers');

const PROVA_URL = '/turmas/jogos/atividades/prova-jogos-engel.html?user=engel.fraga&role=aluno&turma=jogos';

const TOKEN_VALIDO = '482913';
const SEED = {
  profiles: [
    { id: 'fake-engel.fraga', email: 'engel.fraga', nome: 'Engel Fraga', role: 'aluno', turma: 'jogos' },
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
  professor_tokens: [
    { token: TOKEN_VALIDO, created_by: 'fake-admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  ],
};

/** Mesma técnica de tests/prova-jogos.spec.js: document.hidden é só-leitura,
 * então redefine a propriedade antes de disparar o evento que
 * shared/exam-proctor.js escuta. */
async function simulateTabHidden(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

// Abre a prova e já clica "Começar" (trava de tela armada) — a maioria dos
// testes quer chegar direto na 1ª pergunta, não na tela de regras em si
// (essa tem teste próprio).
async function openProva(page) {
  await stubSupabaseFake(page, SEED);
  await page.goto(PROVA_URL);
  await page.click('#btnIniciar');
}

test.describe('turmas/jogos/atividades/prova-jogos-engel.html', () => {
  test('mostra a tela de regras antes de começar, não a prova direto', async ({ page }) => {
    await stubSupabaseFake(page, SEED);
    await page.goto(PROVA_URL);
    await expect(page.locator('#gateWrap')).toContainText('Antes de começar');
    await expect(page.locator('#stageWrap')).toBeHidden();
  });

  test('depois de "Começar", mostra a 1ª pergunta, com as 15 perguntas + resultado no total', async ({ page }) => {
    await openProva(page);
    await expect(page.locator('.bloco-label')).toContainText('Pergunta 1');
    const total = await page.evaluate(() => QUESTIONS.length);
    expect(total).toBe(15);
    await expect(page.locator('#lblStepTotal')).toHaveText('16');
  });

  test('cada pergunta vem com exatamente 3 alternativas', async ({ page }) => {
    await openProva(page);
    await expect(page.locator('.option')).toHaveCount(3);
    await expect(page.locator('.opt-letter').nth(2)).toHaveText('C');
  });

  test('responder certo mostra feedback de acerto, e responder errado mostra a resposta certa', async ({ page }) => {
    await openProva(page);

    const correctIdx = await page.evaluate(() => QUESTIONS[0].certa);
    const wrongIdx = correctIdx === 0 ? 1 : 0;

    await page.locator('.option').nth(wrongIdx).click();
    await expect(page.locator('.feedback.incorrect')).toContainText('Quase!');
    await expect(page.locator('.option').nth(correctIdx)).toHaveClass(/correct/);
  });

  test('responde as 15 perguntas e conclui, mostrando o placar', async ({ page }) => {
    await openProva(page);

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
    await openProva(page);
    const correctIdx0 = await page.evaluate(() => QUESTIONS[0].certa);
    await page.locator('.option').nth(correctIdx0).click();
    await page.click('#btnNext');

    await expect(page.locator('.bloco-label')).toContainText('Pergunta 2');

    await page.reload();
    await expect(page.locator('.bloco-label')).toContainText('Pergunta 2');
  });

  test('gabarito lista as 15 perguntas com a resposta certa pra cada uma', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/atividades/prova-jogos-engel.html?user=admin&role=professor&turma=jogos');

    const download = await gerarGabaritoFlutuante(page);
    expect(download.suggestedFilename()).toBe('prova-jogos-engel-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('Formar Frases');
  });
});

test.describe('turmas/jogos/atividades/prova-jogos-engel.html — trava de tela', () => {
  test('1ª saída da aba avisa, 2ª bloqueia — e o professor desbloqueia com o token', async ({ page }) => {
    await openProva(page);

    // 1ª saída: aviso, a prova continua acessível por baixo do overlay.
    await simulateTabHidden(page);
    await expect(page.locator('.warn-overlay')).toContainText('Aviso 1/2');
    await page.click('#btnWarnOk');
    await expect(page.locator('.warn-overlay')).toHaveCount(0);
    await expect(page.locator('#stageWrap')).toBeVisible();

    // 2ª saída: bloqueia de verdade — a prova some, entra a tela de bloqueio.
    await simulateTabHidden(page);
    await expect(page.locator('#gateWrap')).toContainText('Prova bloqueada');
    await expect(page.locator('#stageWrap')).toBeHidden();

    const blockedState = await page.evaluate(u => JSON.parse(localStorage.getItem(`prova_jogos_engel_guard_${u}`)), 'engel.fraga');
    expect(blockedState.blocked).toBe(true);

    // Sem o token do professor não sai da tela de bloqueio.
    await page.fill('#unlockToken', '000000');
    await page.click('#btnUnlock');
    await expect(page.locator('#gateWrap')).toContainText('Prova bloqueada');

    // Com o token certo, volta pra tela de regras (não direto pra prova) e zera os avisos.
    await page.fill('#unlockToken', TOKEN_VALIDO);
    await page.click('#btnUnlock');
    await expect(page.locator('#gateWrap')).toContainText('Antes de começar');
    const unlockedState = await page.evaluate(u => JSON.parse(localStorage.getItem(`prova_jogos_engel_guard_${u}`)), 'engel.fraga');
    expect(unlockedState.blocked).toBe(false);
    expect(unlockedState.warnings).toBe(0);
  });

  test('depois de responder as 15 perguntas, a prova abre direto no placar (sem tela de regras) e sair da aba não conta mais aviso', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      const respostas = new Array(15).fill(true);
      localStorage.setItem(`prova_jogos_engel_progress_${u}`, JSON.stringify({ respostas, completed: true, correctCount: 15 }));
    }, 'engel.fraga');

    await page.goto(PROVA_URL);
    await expect(page.locator('.score-box h2')).toContainText('Você terminou!');

    await simulateTabHidden(page);
    await expect(page.locator('.warn-overlay')).toHaveCount(0);
  });

  test('professor abre a prova direto, sem tela de regras nem risco de bloqueio', async ({ page }) => {
    await stubSupabaseFake(page, {
      profiles: [{ id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' }],
    });
    await page.goto('/turmas/jogos/atividades/prova-jogos-engel.html?user=admin&role=professor&turma=jogos');
    await expect(page.locator('.bloco-label')).toContainText('Pergunta 1');
    await expect(page.locator('#btnSkipProfessor')).toBeVisible();
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

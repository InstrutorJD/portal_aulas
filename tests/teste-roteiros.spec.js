// @ts-check
// Trilha "Roteiros de Teste: Certificação, Plataforma e Publicação" (Testes
// de Jogos Digitais, turma Jogos): módulo "Trabalho" (orientação em etapas +
// visto do professor, mesmo padrão de modelagem-dados-requisitos-
// trabalho.html) travando o módulo "Questionário" (história + quiz,
// shared/quiz-teoria-engine.js) até o visto — e o Questionário só arma a
// trava de integridade (shared/exam-proctor.js) depois que o aluno clica
// "Iniciar".
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const TRABALHO_URL = '/turmas/jogos/atividades/teste-roteiros-trabalho.html?user=breno.silva80&role=aluno&turma=jogos';
const QUESTIONARIO_URL = '/turmas/jogos/atividades/teste-roteiros-questionario.html?user=breno.silva80&role=aluno&turma=jogos';

const TOKEN_VALIDO = '482913';

const SEED = {
  profiles: [
    { id: 'fake-breno.silva80', email: 'breno.silva80', nome: 'Breno Silva', role: 'aluno', turma: 'jogos' },
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
  professor_tokens: [
    { token: TOKEN_VALIDO, created_by: 'fake-admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  ],
};

/** Marca o "Trabalho" como concluído direto no localStorage (mesmo atalho
 * usado por outras specs pra pular etapas já cobertas em outro teste). */
async function seedTrabalhoConcluido(page) {
  await page.addInitScript(() => {
    localStorage.setItem('teste_roteiros_trabalho_progress_breno.silva80', JSON.stringify({ completed: true, vistoPor: 'Instrutor / Professor', vistoEm: new Date().toISOString() }));
  });
}

/** Simula a aba/janela saindo de foco — sem isso não dá pra testar a trava
 * de integridade (shared/exam-proctor.js) de verdade, já que Playwright
 * não troca de aba de fato. document.hidden é só-leitura de propósito,
 * então redefine a própria propriedade antes de disparar o evento que o
 * guard escuta. */
async function simulateTabHidden(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

test.describe('turmas/jogos — trilha Roteiros de Teste', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('aparece em Testes de Jogos Digitais, com o Questionário travado até o visto do Trabalho', async ({ page }) => {
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno');
    await page.click('.game-card:has-text("Testes de Jogos Digitais")');
    await page.selectOption('#trilhaSelect', 'teste-roteiros-avancados');
    await expect(page.locator('#moduleSelector_teste-roteiros-avancados')).toContainText('Trabalho');

    const questionarioCard = page.locator('#moduleSelector_teste-roteiros-avancados .game-card', { hasText: 'Questionário' });
    await expect(questionarioCard).toHaveClass(/locked/);
    await expect(questionarioCard).toContainText('Bloqueado');
  });

  test('Trabalho: navega pelas 9 etapas com Voltar/Próximo e dá o visto com o token do professor', async ({ page }) => {
    await page.goto(TRABALHO_URL);
    await expect(page.locator('#lblStepTotal')).toHaveText('10');

    for (let i = 0; i < 9; i++) {
      await expect(page.locator('#lblStepNum')).toHaveText(String(i + 1));
      await page.click('#btnNext');
    }

    await expect(page.locator('h2')).toContainText('Visto do professor');
    await page.fill('#vistoToken', TOKEN_VALIDO);
    await page.click('#btnDarVisto');
    await expect(page.locator('h2')).toContainText('Atividade concluída');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('teste_roteiros_trabalho_progress_breno.silva80')));
    expect(stored.completed).toBe(true);

    // Voltar uma etapa some com a tela de visto e volta pro conteúdo normal.
    await page.click('#btnBack');
    await expect(page.locator('#lblStepNum')).toHaveText('9');
  });

  test('Questionário: mostra a tela de regras antes de iniciar, não o quiz direto', async ({ page }) => {
    await seedTrabalhoConcluido(page);
    await page.goto(QUESTIONARIO_URL);
    await expect(page.locator('#gateWrap')).toContainText('Regras deste questionário');
    await expect(page.locator('#storyWrap')).toBeHidden();
    await expect(page.locator('#btnIniciar')).toBeVisible();
  });

  test('Questionário: a ordem das perguntas embaralha entre tentativas', async ({ page }) => {
    test.setTimeout(60000);
    await seedTrabalhoConcluido(page);

    const orders = [];
    for (let i = 0; i < 4; i++) {
      await page.addInitScript(() => {
        localStorage.removeItem('teste_roteiros_questionario_order_breno.silva80');
        localStorage.removeItem('teste_roteiros_questionario_guard_breno.silva80');
      });
      await page.goto(QUESTIONARIO_URL);
      await page.click('#btnIniciar');
      await expect(page.locator('#storyWrap')).toBeVisible();
      const order = await page.evaluate(() => window.stepOrder);
      orders.push(JSON.stringify(order));
    }

    const distintas = new Set(orders);
    expect(distintas.size, 'a mesma ordem saiu em todas as tentativas — o embaralhamento não parece estar rodando').toBeGreaterThan(1);
  });

  test('Questionário: 1ª saída da aba avisa, 2ª bloqueia — e o professor desbloqueia com o token', async ({ page }) => {
    await seedTrabalhoConcluido(page);
    await page.goto(QUESTIONARIO_URL);
    await page.click('#btnIniciar');
    await expect(page.locator('#storyWrap')).toBeVisible();

    // 1ª saída: advertência, quiz continua acessível por baixo do aviso.
    await simulateTabHidden(page);
    await expect(page.locator('.warn-overlay')).toContainText('Advertência 1/2');
    await page.click('#btnWarnOk');
    await expect(page.locator('.warn-overlay')).toHaveCount(0);
    await expect(page.locator('#storyWrap')).toBeVisible();

    // 2ª saída: bloqueia de verdade — quiz some, entra a tela de bloqueio.
    await simulateTabHidden(page);
    await expect(page.locator('#gateWrap')).toContainText('Atividade bloqueada');
    await expect(page.locator('#storyWrap')).toBeHidden();

    const blockedState = await page.evaluate(() => JSON.parse(localStorage.getItem('teste_roteiros_questionario_guard_breno.silva80')));
    expect(blockedState.blocked).toBe(true);

    // Sem o token do professor não sai da tela de bloqueio.
    await page.fill('#unlockToken', '000000');
    await page.click('#btnUnlock');
    await expect(page.locator('#gateWrap')).toContainText('Atividade bloqueada');

    // Com o token certo, volta pra tela de regras (não direto pro quiz) e zera as advertências.
    await page.fill('#unlockToken', TOKEN_VALIDO);
    await page.click('#btnUnlock');
    await expect(page.locator('#gateWrap')).toContainText('Regras deste questionário');
    const unlockedState = await page.evaluate(() => JSON.parse(localStorage.getItem('teste_roteiros_questionario_guard_breno.silva80')));
    expect(unlockedState.blocked).toBe(false);
    expect(unlockedState.warnings).toBe(0);
  });
});

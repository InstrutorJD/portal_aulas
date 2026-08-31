// @ts-check
// Trilha "Modelagem de Dados e Requisitos" (Modelagem de Sistemas 1, turma
// Sistemas): módulo "Trabalho" (orientação em etapas + visto do professor,
// mesmo padrão de db-conexao-supabase-pratica.html) travando o módulo
// "Questionário" (história + quiz, shared/quiz-teoria-engine.js) até o
// visto — e o Questionário só arma a trava de integridade
// (shared/exam-proctor.js) depois que o aluno clica "Iniciar".
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const TRABALHO_URL = '/turmas/sistemas/atividades/modelagem-dados-requisitos-trabalho.html?user=alexandre.natal&role=aluno&turma=sistemas';
const QUESTIONARIO_URL = '/turmas/sistemas/atividades/modelagem-dados-requisitos-questionario.html?user=alexandre.natal&role=aluno&turma=sistemas';

const TOKEN_VALIDO = '482913';

const SEED = {
  profiles: [
    { id: 'fake-alexandre.natal', email: 'alexandre.natal', nome: 'Alexandre Natal', role: 'aluno', turma: 'sistemas' },
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
    localStorage.setItem('modelagem_dados_requisitos_trabalho_progress_alexandre.natal', JSON.stringify({ completed: true, vistoPor: 'Instrutor / Professor', vistoEm: new Date().toISOString() }));
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

test.describe('turmas/sistemas — trilha Modelagem de Dados e Requisitos', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('aparece em Modelagem de Sistemas 1, com o Questionário travado até o visto do Trabalho', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Modelagem de Sistemas 1")');
    await expect(page.locator('#moduleSelector_modelagem-dados-requisitos')).toContainText('Trabalho');

    const questionarioCard = page.locator('#moduleSelector_modelagem-dados-requisitos .game-card', { hasText: 'Questionário' });
    await expect(questionarioCard).toHaveClass(/locked/);
    await expect(questionarioCard).toContainText('Bloqueado');
  });

  test('Trabalho: navega pelas 5 etapas com Voltar/Próximo e dá o visto com o token do professor', async ({ page }) => {
    await page.goto(TRABALHO_URL);
    await expect(page.locator('#lblStepTotal')).toHaveText('6');

    for (let i = 0; i < 5; i++) {
      await expect(page.locator('#lblStepNum')).toHaveText(String(i + 1));
      await page.click('#btnNext');
    }

    await expect(page.locator('h2')).toContainText('Visto do professor');
    await page.fill('#vistoToken', TOKEN_VALIDO);
    await page.click('#btnDarVisto');
    await expect(page.locator('h2')).toContainText('Atividade concluída');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('modelagem_dados_requisitos_trabalho_progress_alexandre.natal')));
    expect(stored.completed).toBe(true);

    // Voltar uma etapa some com a tela de visto e volta pro conteúdo normal.
    await page.click('#btnBack');
    await expect(page.locator('#lblStepNum')).toHaveText('5');
  });

  test('Questionário: mostra a tela de regras antes de iniciar, não o quiz direto', async ({ page }) => {
    await seedTrabalhoConcluido(page);
    await page.goto(QUESTIONARIO_URL);
    await expect(page.locator('#gateWrap')).toContainText('Regras deste questionário');
    await expect(page.locator('#storyWrap')).toBeHidden();
    await expect(page.locator('#btnIniciar')).toBeVisible();
  });

  test('Questionário: a ordem das perguntas embaralha entre tentativas', async ({ page }) => {
    // 4 navegações completas (cada uma carrega ~13 scripts, incluindo o
    // bundle do pptxgen) somadas ao timeout padrão (30s) estouram o
    // orçamento — a chance de embaralhamento de verdade repetir a mesma
    // ordem em 4 tentativas seguidas já é desprezível (1 em 11!⁴).
    test.setTimeout(60000);
    await seedTrabalhoConcluido(page);

    const orders = [];
    for (let i = 0; i < 4; i++) {
      // Limpa a chave de ordem salva (senão o motor reaproveita a mesma
      // ordem de uma tentativa incompleta anterior, em vez de sortear de novo)
      // e a chave da trava de integridade — clicar "Iniciar" arma o guard
      // (shared/exam-proctor.js), e navegar embora pra próxima iteração é,
      // pro navegador, exatamente um "saiu da aba" de verdade; sem limpar,
      // a 2ª iteração já bloqueia (comportamento correto do guard, só não
      // é o que este teste quer observar).
      await page.addInitScript(() => {
        localStorage.removeItem('modelagem_dados_requisitos_questionario_order_alexandre.natal');
        localStorage.removeItem('modelagem_dados_requisitos_questionario_guard_alexandre.natal');
      });
      await page.goto(QUESTIONARIO_URL);
      await page.click('#btnIniciar');
      await expect(page.locator('#storyWrap')).toBeVisible();
      const order = await page.evaluate(() => window.stepOrder);
      orders.push(JSON.stringify(order));
    }

    const distintas = new Set(orders);
    expect(distintas.size, 'a mesma ordem saiu em todas as 6 tentativas — o embaralhamento não parece estar rodando').toBeGreaterThan(1);
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

    const blockedState = await page.evaluate(() => JSON.parse(localStorage.getItem('modelagem_dados_requisitos_questionario_guard_alexandre.natal')));
    expect(blockedState.blocked).toBe(true);

    // Sem o token do professor não sai da tela de bloqueio.
    await page.fill('#unlockToken', '000000');
    await page.click('#btnUnlock');
    await expect(page.locator('#gateWrap')).toContainText('Atividade bloqueada');

    // Com o token certo, volta pra tela de regras (não direto pro quiz) e zera as advertências.
    await page.fill('#unlockToken', TOKEN_VALIDO);
    await page.click('#btnUnlock');
    await expect(page.locator('#gateWrap')).toContainText('Regras deste questionário');
    const unlockedState = await page.evaluate(() => JSON.parse(localStorage.getItem('modelagem_dados_requisitos_questionario_guard_alexandre.natal')));
    expect(unlockedState.blocked).toBe(false);
    expect(unlockedState.warnings).toBe(0);
  });
});

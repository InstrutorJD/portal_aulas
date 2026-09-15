// @ts-check
// Trilha "FinancApp — Construa o Aplicativo" (Programação de Aplicativos,
// turma Sistemas) — 5ª e última peça do projeto interdisciplinar FinancApp
// (ver tests/projeto-financapp-kickoff.spec.js pra 1ª peça). Incorpora o que
// antes era a peça separada de Desenvolvimento de Sistemas 1 ("Lógica de
// Backend com Supabase", extinta) — o aluno escreve as 5 funções de backend
// e depois o JavaScript da interface, tudo nesta mesma atividade; o HTML/CSS
// já vêm prontos, entregues pelo professor. Aluno navega pelas telas com
// Voltar/Próximo e o professor dá "visto" com um token temporário (mesmo
// padrão de projeto-financapp-kickoff-trabalho.html).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const ACTIVITY_URL = '/turmas/sistemas/atividades/projeto-financapp-app-trabalho.html?user=alexandre.natal&role=aluno&turma=sistemas';

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

async function darVisto(page, token) {
  await page.fill('#vistoToken', token);
  await page.click('#btnDarVisto');
}

test.describe('turmas/sistemas — trilha FinancApp: Construa o Aplicativo', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('aparece na matéria Programação de Aplicativos, ao lado do ClipZone', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Programação de Aplicativos")');
    await page.selectOption('#trilhaSelect', 'projeto-financapp-app');
    await expect(page.locator('#moduleSelector_projeto-financapp-app')).toContainText('FinancApp: Construa o Aplicativo (JavaScript)');
  });

  test('a apresentação explica que o HTML/CSS já vêm prontos', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    await expect(page.locator('.card')).toContainText('HTML e CSS já vêm prontos');
  });

  test('navega pelas telas com Voltar/Próximo e lembra onde o aluno parou (bloco de backend)', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    await expect(page.locator('.card h2')).toHaveText('Apresentação');

    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Biblioteca vs. requisição na mão');
    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('cadastrarUsuario');

    await page.reload();
    await expect(page.locator('.card h2')).toHaveText('cadastrarUsuario');

    await page.click('#btnBack');
    await expect(page.locator('.card h2')).toHaveText('Biblioteca vs. requisição na mão');
  });

  test('navega até o bloco de interface (depois do backend)', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    // Apresentação -> Biblioteca -> cadastrarUsuario -> fazerLogin -> criarLancamento
    // -> carregarLancamentos -> adicionarTag -> "Por que { data, error }..." -> Conheça o HTML já pronto = 8 cliques.
    for (let i = 0; i < 8; i++) await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Conheça o HTML já pronto');

    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Cadastro');

    await page.reload();
    await expect(page.locator('.card h2')).toHaveText('Cadastro');

    await page.click('#btnBack');
    await expect(page.locator('.card h2')).toHaveText('Conheça o HTML já pronto');
  });

  test('depois da última tela de conteúdo, chega na tela de visto do professor', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');
    await expect(page.locator('.visto-box h2')).toContainText('Visto do professor');
    await expect(page.locator('#btnDarVisto')).toBeVisible();
  });

  test('token errado mostra erro e não conclui a atividade', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, '000000');
    await expect(page.locator('#vistoMsg')).toContainText('inválido ou expirado');

    const progress = await page.evaluate(u => localStorage.getItem(`projeto_financapp_app_trabalho_progress_${u}`), 'alexandre.natal');
    expect(progress).toBeNull();
  });

  test('visto do professor conclui a atividade', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, TOKEN_VALIDO);
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
    await expect(page.locator('.visto-box')).toContainText('Instrutor / Professor');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`projeto_financapp_app_trabalho_progress_${u}`)), 'alexandre.natal');
    expect(progress).toMatchObject({ completed: true, vistoPor: 'Instrutor / Professor' });

    await page.reload();
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
  });
});

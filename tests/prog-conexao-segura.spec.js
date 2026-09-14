// @ts-check
// Trilha "Conexão Segura com Banco de Dados" (Programação de Aplicativos,
// turma Sistemas) — fundamento standalone (não é uma das 6 peças do
// projeto FinancApp) sobre tipos de chave do Supabase, .env e .gitignore.
// Aluno navega pelas telas com Voltar/Próximo e o professor dá "visto" com
// um token temporário (mesmo padrão de projeto-financapp-kickoff-trabalho.html).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const ACTIVITY_URL = '/turmas/sistemas/atividades/prog-conexao-segura-trabalho.html?user=alexandre.natal&role=aluno&turma=sistemas';

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

test.describe('turmas/sistemas — trilha Conexão Segura com Banco de Dados', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('aparece na matéria Programação de Aplicativos, ao lado do FinancApp', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Programação de Aplicativos")');
    await page.selectOption('#trilhaSelect', 'prog-conexao-segura');
    await expect(page.locator('#moduleSelector_prog-conexao-segura')).toContainText('Conexão Segura com Banco de Dados');
  });

  test('navega pelas telas com Voltar/Próximo e lembra onde o aluno parou', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    await expect(page.locator('.card h2')).toHaveText('Apresentação');

    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Nem toda chave é igual');
    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('O que é uma variável de ambiente');

    await page.reload();
    await expect(page.locator('.card h2')).toHaveText('O que é uma variável de ambiente');

    await page.click('#btnBack');
    await expect(page.locator('.card h2')).toHaveText('Nem toda chave é igual');
  });

  test('explica a diferença entre anon/publishable e service_role', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    await page.click('#btnNext');
    await expect(page.locator('.card')).toContainText('anon / publishable');
    await expect(page.locator('.card')).toContainText('service_role');
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

    const progress = await page.evaluate(u => localStorage.getItem(`prog_conexao_segura_trabalho_progress_${u}`), 'alexandre.natal');
    expect(progress).toBeNull();
  });

  test('visto do professor conclui a atividade', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, TOKEN_VALIDO);
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
    await expect(page.locator('.visto-box')).toContainText('Instrutor / Professor');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`prog_conexao_segura_trabalho_progress_${u}`)), 'alexandre.natal');
    expect(progress).toMatchObject({ completed: true, vistoPor: 'Instrutor / Professor' });

    await page.reload();
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
  });
});

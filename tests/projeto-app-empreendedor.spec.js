// @ts-check
// Trilha "Projeto Empreendedor: Crie seu App" (matéria Prova, turma
// Sistemas) — trabalho em dupla: o aluno navega pelas telas com
// Voltar/Próximo (ideia, modelagem de sistemas, modelagem de banco de
// dados, protótipo no Figma, custo/receita, apresentação) e o professor dá
// "visto" com um token temporário no final (mesmo padrão de
// projeto-mural-kickoff-trabalho.html e
// modelagem-dados-requisitos-trabalho.html). A nota (até 10 pontos) não é
// lançada nesta tela — é lançada em Lançar Notas (Nota 3/4), fora do
// escopo deste teste.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const ACTIVITY_URL = '/turmas/sistemas/atividades/projeto-app-empreendedor-trabalho.html?user=alexandre.natal&role=aluno&turma=sistemas';

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

test.describe('turmas/sistemas — trilha Projeto Empreendedor: Crie seu App', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('aparece na matéria Prova, ao lado da Prova Diagnóstica', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Prova")');
    await page.selectOption('#trilhaSelect', 'projeto-app-empreendedor');
    await expect(page.locator('#moduleSelector_projeto-app-empreendedor')).toContainText('Projeto Empreendedor: Crie seu App (Dupla)');
  });

  test('navega pelas telas com Voltar/Próximo e lembra onde o aluno parou', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    await expect(page.locator('.card h2')).toHaveText('Apresentação');

    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('A ideia do app');
    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Modelagem de sistemas');

    await page.reload();
    await expect(page.locator('.card h2')).toHaveText('Modelagem de sistemas');

    await page.click('#btnBack');
    await expect(page.locator('.card h2')).toHaveText('A ideia do app');
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

    const progress = await page.evaluate(u => localStorage.getItem(`projeto_app_empreendedor_trabalho_progress_${u}`), 'alexandre.natal');
    expect(progress).toBeNull();
  });

  test('visto do professor conclui a atividade', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, TOKEN_VALIDO);
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
    await expect(page.locator('.visto-box')).toContainText('Instrutor / Professor');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`projeto_app_empreendedor_trabalho_progress_${u}`)), 'alexandre.natal');
    expect(progress).toMatchObject({ completed: true, vistoPor: 'Instrutor / Professor' });

    // Recarregar mostra a tela de concluído, não o formulário de novo.
    await page.reload();
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
  });
});

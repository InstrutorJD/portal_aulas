// @ts-check
// Trilha "Kickoff: Rede Social da Escola (Mural)" (Introdução de
// Desenvolvimento de Projetos, turma Sistemas) — 1ª peça do projeto
// interdisciplinar "Mural": o aluno cria um repositório real no GitHub
// (fora do portal) e só navega pelas telas com Voltar/Próximo; quem marca
// como concluída é o professor, dando "visto" com um token temporário
// (mesmo padrão de oficina-comunicacao-trabalho.html e
// modelagem-dados-requisitos-trabalho.html).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const ACTIVITY_URL = '/turmas/sistemas/atividades/projeto-mural-kickoff-trabalho.html?user=alexandre.natal&role=aluno&turma=sistemas';

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

test.describe('turmas/sistemas — trilha Kickoff do Projeto Mural', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('aparece na matéria Introdução de Desenvolvimento de Projetos, ao lado da Oficina de Comunicação', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Introdução de Desenvolvimento de Projetos")');
    await page.selectOption('#trilhaSelect', 'projeto-mural-kickoff');
    await expect(page.locator('#moduleSelector_projeto-mural-kickoff')).toContainText('Kickoff do Projeto Mural (GitHub)');
  });

  test('navega pelas telas com Voltar/Próximo e lembra onde o aluno parou', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    await expect(page.locator('.card h2')).toHaveText('Apresentação');

    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Fases de um projeto, agora na prática');
    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Controle de versão e GitHub');

    await page.reload();
    await expect(page.locator('.card h2')).toHaveText('Controle de versão e GitHub');

    await page.click('#btnBack');
    await expect(page.locator('.card h2')).toHaveText('Fases de um projeto, agora na prática');
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

    const progress = await page.evaluate(u => localStorage.getItem(`projeto_mural_kickoff_trabalho_progress_${u}`), 'alexandre.natal');
    expect(progress).toBeNull();
  });

  test('visto do professor conclui a atividade', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, TOKEN_VALIDO);
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
    await expect(page.locator('.visto-box')).toContainText('Instrutor / Professor');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`projeto_mural_kickoff_trabalho_progress_${u}`)), 'alexandre.natal');
    expect(progress).toMatchObject({ completed: true, vistoPor: 'Instrutor / Professor' });

    // Recarregar mostra a tela de concluído, não o formulário de novo.
    await page.reload();
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
  });
});

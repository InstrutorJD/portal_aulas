// @ts-check
// Módulo "Como o FinancApp Conversa com a Internet" — 4ª de 5 peças do
// projeto FinancApp, na trilha única 'projeto-financapp' (card "Projetos",
// turma Sistemas). Antes ficava dentro da trilha "Serviços de Internet e
// Modelos" de Redes, travado até a prática dela. Aluno navega pelas telas
// com Voltar/Próximo e o professor dá "visto" com um token temporário
// (mesmo padrão de projeto-financapp-kickoff-trabalho.html).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const ACTIVITY_URL = '/turmas/sistemas/atividades/redes-servicos-financapp-pratica.html?user=alexandre.natal&role=aluno&turma=sistemas';

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

test.describe('turmas/sistemas — módulo FinancApp: Como o FinancApp Conversa com a Internet', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('aparece na trilha única do FinancApp, no card Projetos, sem trava', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    // Card "Projetos" (h3 exato — "Introdução de Desenvolvimento de Projetos"
    // também contém "Projetos"); trilha única, então sem #trilhaSelect.
    await page.click('.game-card:has(h3:text-is("Projetos"))');
    const card = page.locator('#moduleSelector_projeto-financapp .game-card', { hasText: 'Como o FinancApp Conversa com a Internet' });
    await expect(card).toBeVisible();
    await expect(card).not.toHaveClass(/locked/);
  });

  test('não aparece mais na trilha "Serviços de Internet e Modelos" de Redes', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Redes de Computadores")');
    await page.selectOption('#trilhaSelect', 'redes-servicos-modelos');
    await expect(page.locator('#moduleSelector_redes-servicos-modelos')).not.toContainText('FinancApp');
  });

  test('navega pelas telas com Voltar/Próximo e lembra onde o aluno parou', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    await expect(page.locator('.card h2')).toHaveText('Apresentação');

    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Requisição HTTP');
    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('DNS');

    await page.reload();
    await expect(page.locator('.card h2')).toHaveText('DNS');

    await page.click('#btnBack');
    await expect(page.locator('.card h2')).toHaveText('Requisição HTTP');
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

    const progress = await page.evaluate(u => localStorage.getItem(`redes_servicos_financapp_pratica_progress_${u}`), 'alexandre.natal');
    expect(progress).toBeNull();
  });

  test('visto do professor conclui a atividade', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, TOKEN_VALIDO);
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
    await expect(page.locator('.visto-box')).toContainText('Instrutor / Professor');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`redes_servicos_financapp_pratica_progress_${u}`)), 'alexandre.natal');
    expect(progress).toMatchObject({ completed: true, vistoPor: 'Instrutor / Professor' });

    await page.reload();
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
  });
});

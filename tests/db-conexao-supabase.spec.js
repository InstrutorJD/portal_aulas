// @ts-check
// Trilha "Conexão com Supabase" (Banco de Dados, turma Sistemas) — projeto
// integrador que o portal não corrige sozinho (GitHub Codespaces + um
// Supabase próprio do aluno). O aluno só navega pelas telas com
// Voltar/Próximo; quem marca como concluída é o professor, dando "visto"
// com um TOKEN temporário (não mais a própria credencial — ver
// shared/professor-visto.js e PENDENCIAS.md: a senha real chegou a vazar
// pros alunos por esse fluxo antigo).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const ACTIVITY_URL = '/turmas/sistemas/atividades/db-conexao-supabase-pratica.html?user=alexandre.natal&role=aluno&turma=sistemas';
const AUTH_STORAGE_KEY = '__fake_supabase_session';

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

test.describe('turmas/sistemas — trilha Conexão com Supabase', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('aparece na matéria Banco de Dados, dentro da própria trilha', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Banco de Dados")');
    await page.selectOption('#trilhaSelect', 'db-conexao-supabase');
    await expect(page.locator('#moduleSelector_db-conexao-supabase')).toContainText('Sistema Web com HTML, JavaScript e Supabase');
  });

  test('navega pelas telas com Voltar/Próximo e lembra onde o aluno parou', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    await expect(page.locator('.card h2')).toHaveText('Apresentação');

    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Preparar o ambiente — GitHub e Codespace');
    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Criar a página HTML e o formulário');

    await page.reload();
    await expect(page.locator('.card h2')).toHaveText('Criar a página HTML e o formulário');

    await page.click('#btnBack');
    await expect(page.locator('.card h2')).toHaveText('Preparar o ambiente — GitHub e Codespace');
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

    const progress = await page.evaluate(u => localStorage.getItem(`db_conexao_supabase_pratica_progress_${u}`), 'alexandre.natal');
    expect(progress).toBeNull();
  });

  test('token expirado é recusado mesmo com o valor certo', async ({ page }) => {
    await page.addInitScript(() => {
      window.__FAKE_DB__ = window.__FAKE_DB__ || {};
      window.__FAKE_DB__.professor_tokens = [
        { token: '482913', created_by: 'fake-admin', created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(), expires_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
      ];
    });
    await page.goto(ACTIVITY_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, TOKEN_VALIDO);
    await expect(page.locator('#vistoMsg')).toContainText('inválido ou expirado');
  });

  test('visto do professor conclui a atividade sem trocar a sessão do aluno', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    // Garante que a sessão do aluno já está persistida (identidade
    // sintetizada a partir da própria URL, ver fixtures/fake-supabase-client.js)
    // antes de dar o visto, pra provar que ela sobrevive ao fluxo.
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), AUTH_STORAGE_KEY)).not.toBeNull();

    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, TOKEN_VALIDO);
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
    await expect(page.locator('.visto-box')).toContainText('Instrutor / Professor');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`db_conexao_supabase_pratica_progress_${u}`)), 'alexandre.natal');
    expect(progress).toMatchObject({ completed: true, vistoPor: 'Instrutor / Professor' });

    // A sessão principal (a mesma chave que window.PortalSession usa)
    // continua sendo a do ALUNO — o "Dar visto" nunca deveria trocar isso.
    const session = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), AUTH_STORAGE_KEY);
    expect(session.id).toBe('fake-alexandre.natal');

    // Recarregar mostra a tela de concluído, não o formulário de novo.
    await page.reload();
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
  });

  test('fechar o módulo dentro do portal sincroniza a conclusão pro student_module_progress', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Banco de Dados")');
    await page.selectOption('#trilhaSelect', 'db-conexao-supabase');
    await page.click('#moduleSelector_db-conexao-supabase .game-card');
    await expect(page.locator('#moduleFrameArea_db-conexao-supabase')).toBeVisible();

    const frame = page.frameLocator('#moduleFrame_db-conexao-supabase');
    const total = await frame.locator('body').evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await frame.locator('#btnNext').click();
    await frame.locator('#vistoToken').fill(TOKEN_VALIDO);
    await frame.locator('#btnDarVisto').click();
    await expect(frame.locator('.visto-box h2')).toContainText('Atividade concluída');

    await page.click('#moduleFrameArea_db-conexao-supabase .btn-secondary');
    await expect(page.locator('#moduleFrameArea_db-conexao-supabase')).toBeHidden();

    const rows = await page.evaluate(() => window.__FAKE_DB__.student_module_progress || []);
    const row = rows.find(r => r.trilha_key === 'db-conexao-supabase' && r.module_key === 'pratica');
    expect(row).toMatchObject({ student_email: 'alexandre.natal', turma: 'sistemas', completed: true });
  });
});

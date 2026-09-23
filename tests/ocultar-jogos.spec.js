// @ts-check
// "Ocultar Jogos" (aba Gestão → seção "Bloqueios e Liberações" →
// "Ocultar Jogos", tabela hidden_modules): esconde um jogo/atividade
// específico (não a trilha inteira, ver bimestre-dates.spec.js) da lista
// do aluno enquanto ainda está em desenvolvimento — sem trava por data,
// só um interruptor manual (hidden true/false). O professor sempre
// continua vendo e conseguindo abrir o módulo, com um selo avisando.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const SISTEMAS_PROFESSOR_URL = '/turmas/sistemas/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=sistemas';
const SISTEMAS_ALUNO_URL = '/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno';

async function expandGestaoSection(page, titulo) {
  await page.locator('.collapsible-card .collapsible-head', { hasText: titulo }).click();
}

test.describe('Gestão — ocultar jogos (professor)', () => {
  test('lista todos os módulos com matéria/trilha/título e salva quais estão ocultos em lote', async ({ page }) => {
    await stubSupabaseFake(page, { hidden_modules: [] });
    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await expandGestaoSection(page, 'Bloqueios e Liberações');

    const row = page.locator('#tblGestaoOcultarJogosBody tr[data-trilha="sql"][data-modulo="teoria"]');
    await expect(row).toContainText('Banco de Dados');
    await expect(row).toContainText('SQL');
    await expect(row.locator('input[type="checkbox"]')).not.toBeChecked();

    await row.locator('input[type="checkbox"]').check();
    await page.click('#btnSalvarOcultarJogos');

    await expect(page.locator('#ocultarJogosStatus')).toContainText('Salvo');
    const saved = await page.evaluate(() => window.__FAKE_DB__.hidden_modules || []);
    expect(saved.find(r => r.trilha_key === 'sql' && r.module_key === 'teoria')).toMatchObject({
      turma: 'sistemas', hidden: true,
    });
  });

  test('checkbox já vem marcada pra módulo já escondido, e desmarcar + salvar volta a mostrar', async ({ page }) => {
    await stubSupabaseFake(page, {
      hidden_modules: [{ turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria', hidden: true }],
    });
    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await expandGestaoSection(page, 'Bloqueios e Liberações');

    const row = page.locator('#tblGestaoOcultarJogosBody tr[data-trilha="sql"][data-modulo="teoria"]');
    await expect(row.locator('input[type="checkbox"]')).toBeChecked();

    await row.locator('input[type="checkbox"]').uncheck();
    await page.click('#btnSalvarOcultarJogos');

    const saved = await page.evaluate(() => window.__FAKE_DB__.hidden_modules || []);
    expect(saved.find(r => r.trilha_key === 'sql' && r.module_key === 'teoria')).toMatchObject({ hidden: false });
  });
});

test.describe('Ocultar jogos — efeito na tela do aluno', () => {
  test('módulo oculto some da lista do aluno, mas o resto da trilha continua normal', async ({ page }) => {
    await stubSupabaseFake(page, {
      hidden_modules: [{ turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria', hidden: true }],
    });
    await page.goto(SISTEMAS_ALUNO_URL);
    await page.click('.game-card:has-text("Banco de Dados")');
    await page.selectOption('#trilhaSelect', 'sql').catch(() => {}); // só existe <select> se houver 2+ trilhas na matéria
    await expect(page.locator('#subTabContent_sql')).toBeVisible();

    // A trilha 'sql' tem 4 módulos (teoria + 3 práticas) — só a teoria foi
    // escondida, então sobram os 3 outros, nenhum deles sendo a teoria.
    const cards = page.locator('#moduleSelector_sql .card-grid .game-card');
    await expect(cards).toHaveCount(3);
    await expect(page.locator('#moduleSelector_sql .card-grid .game-card', { hasText: 'Teoria — Fundamentos de SQL' })).toHaveCount(0);
    await expect(cards.first()).toContainText('Prática — Central de Dados');
  });

  test('professor continua vendo o módulo oculto, com o selo de aviso, e consegue abrir', async ({ page }) => {
    await stubSupabaseFake(page, {
      hidden_modules: [{ turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria', hidden: true }],
    });
    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('.game-card:has-text("Banco de Dados")');
    await page.selectOption('#trilhaSelect', 'sql').catch(() => {});
    await expect(page.locator('#subTabContent_sql')).toBeVisible();

    const card = page.locator('#moduleSelector_sql .card-grid .game-card', { hasText: 'Teoria — Fundamentos de SQL e PL/SQL' });
    await expect(card).toContainText('Oculto dos alunos');
    await expect(card).toHaveClass(/hidden-from-students/);

    await card.click();
    await expect(page.locator('#moduleFrameArea_sql')).toBeVisible();
  });
});

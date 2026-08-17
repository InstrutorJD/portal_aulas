// @ts-check
// Bloqueio manual de trilha inteira pelo professor (aba Gestão, seção
// "Trilhas" dentro de "Bloqueios e Liberações"). Não deve mexer na regra
// interna de pré-requisito entre módulos de uma trilha — só some/aparece
// por cima dela.
const { test, expect } = require('@playwright/test');
const { stubSupabaseDisabled, stubSupabaseFake } = require('./helpers');

const SISTEMAS_PROFESSOR_URL = '/turmas/sistemas/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=sistemas';
const SISTEMAS_ALUNO_URL = '/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno';

async function expandGestaoSection(page, titulo) {
  await page.locator('.collapsible-card .collapsible-head', { hasText: titulo }).click();
}

test.describe('Gestão — bloqueio de trilha (professor)', () => {
  test('lista todas as trilhas com a matéria dona e permite bloquear/liberar', async ({ page }) => {
    await stubSupabaseFake(page, { trilha_overrides: [] });
    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await expandGestaoSection(page, 'Bloqueios e Liberações');

    const row = page.locator('#tblGestaoTrilhasBody tr', { hasText: 'SQL' });
    await expect(row).toContainText('Banco de Dados');
    await expect(row).toContainText('LIBERADA');

    await row.locator('button').click();
    await expect(row).toContainText('BLOQUEADA');

    const rows = await page.evaluate(() => window.__FAKE_DB__.trilha_overrides || []);
    expect(rows.find(r => r.trilha_key === 'sql')).toMatchObject({ turma: 'sistemas', locked: true });

    await row.locator('button').click();
    await expect(row).toContainText('LIBERADA');
  });
});

test.describe('Trilha bloqueada — visão do aluno', () => {
  test('módulos da trilha ficam bloqueados, mesmo o primeiro (sem pré-requisito)', async ({ page }) => {
    await stubSupabaseFake(page, {
      trilha_overrides: [{ turma: 'sistemas', trilha_key: 'sql', locked: true }],
    });
    await page.goto(SISTEMAS_ALUNO_URL);
    await page.click('.game-card:has-text("Banco de Dados")');

    const teoriaCard = page.locator('#moduleSelector_sql .game-card', { hasText: 'Teoria — Fundamentos de SQL' });
    await expect(teoriaCard).toHaveClass(/locked/);
    await expect(teoriaCard).toContainText('Bloqueado');

    await teoriaCard.click();
    await expect(page.locator('#moduleFrameArea_sql')).toBeHidden();
  });

  test('trilha liberada destrava o primeiro módulo', async ({ page }) => {
    await stubSupabaseFake(page, {
      trilha_overrides: [{ turma: 'sistemas', trilha_key: 'sql', locked: false }],
    });
    await page.goto(SISTEMAS_ALUNO_URL);
    await page.click('.game-card:has-text("Banco de Dados")');

    const teoriaCard = page.locator('#moduleSelector_sql .game-card', { hasText: 'Teoria — Fundamentos de SQL' });
    await expect(teoriaCard).not.toHaveClass(/locked/);
  });

  test('sem bloqueio de professor, a regra interna de pré-requisito continua valendo', async ({ page }) => {
    await stubSupabaseFake(page, { trilha_overrides: [] });
    await page.goto(SISTEMAS_ALUNO_URL);
    await page.click('.game-card:has-text("Banco de Dados")');

    const praticaCard = page.locator('#moduleSelector_sql .game-card', { hasText: '🗄️ Prática — Central de Dados' });
    await expect(praticaCard).toHaveClass(/locked/);
    await expect(praticaCard).toContainText('Bloqueado');
  });

  test('professor sempre vê a trilha destravada, mesmo com o bloqueio ativo', async ({ page }) => {
    await stubSupabaseFake(page, {
      trilha_overrides: [{ turma: 'sistemas', trilha_key: 'sql', locked: true }],
    });
    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('.game-card:has-text("Banco de Dados")');

    const teoriaCard = page.locator('#moduleSelector_sql .game-card', { hasText: 'Teoria — Fundamentos de SQL' });
    await expect(teoriaCard).not.toHaveClass(/locked/);
  });
});

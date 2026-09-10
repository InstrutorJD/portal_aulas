// @ts-check
// Calendário letivo por bimestre (aba Gestão, seção "Bloqueios e
// Liberações" → "Bimestres — Início e Fim"). Cada trilha pertence ao
// bimestre cujo intervalo contém a data de início EFETIVA dela (ver
// trilhaBimestreInfo em shared/platform-core.js) — passado o fim desse
// bimestre, a trilha some da aba Aulas pra todo mundo, inclusive o
// professor (diferente de trilha_release_dates/prazo, que só bloqueia o
// aluno — ver tests/trilha-release-dates.spec.js).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const SISTEMAS_PROFESSOR_URL = '/turmas/sistemas/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=sistemas';
const SISTEMAS_ALUNO_URL = '/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno';

async function expandGestaoSection(page, titulo) {
  await page.locator('.collapsible-card .collapsible-head', { hasText: titulo }).click();
}

test.describe('Gestão — calendário de bimestres (professor)', () => {
  test('lista os 4 bimestres fixos e salva início/fim em lote', async ({ page }) => {
    await stubSupabaseFake(page, { bimestre_dates: [] });
    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await expandGestaoSection(page, 'Bloqueios e Liberações');

    const rows = page.locator('#tblGestaoBimestresBody tr[data-bimestre]');
    await expect(rows).toHaveCount(4);

    await rows.nth(0).locator('input[data-campo="inicio"]').fill('2026-02-01');
    await rows.nth(0).locator('input[data-campo="fim"]').fill('2026-04-15');
    await page.click('#btnSalvarBimestreDatas');

    await expect(page.locator('#bimestreDatasStatus')).toContainText('Bimestres salvos');
    const saved = await page.evaluate(() => window.__FAKE_DB__.bimestre_dates || []);
    expect(saved.find(r => r.bimestre === 1)).toMatchObject({
      turma: 'sistemas', inicio: '2026-02-01', fim: '2026-04-15',
    });
  });

  test('tabela de trilhas mostra a qual bimestre cada trilha pertence, deduzido pelo início dela', async ({ page }) => {
    await stubSupabaseFake(page, {
      bimestre_dates: [{ turma: 'sistemas', bimestre: 1, inicio: '2026-02-01', fim: '2026-04-15' }],
      trilha_release_dates: [{ turma: 'sistemas', trilha_key: 'sql', inicio: '2026-02-10' }],
    });
    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await expandGestaoSection(page, 'Bloqueios e Liberações');

    const row = page.locator('#tblGestaoTrilhasBody tr[data-trilha="sql"]');
    await expect(row).toContainText('1º Bimestre');
  });
});

test.describe('Trilha com bimestre encerrado', () => {
  test('some pro aluno', async ({ page }) => {
    await stubSupabaseFake(page, {
      bimestre_dates: [{ turma: 'sistemas', bimestre: 1, inicio: '2000-01-01', fim: '2000-03-31' }],
      trilha_release_dates: [{ turma: 'sistemas', trilha_key: 'sql', inicio: '2000-02-01' }],
    });
    await page.goto(SISTEMAS_ALUNO_URL);
    await page.click('.game-card:has-text("Banco de Dados")');

    await expect(page.locator('#materiaDetailArea')).not.toContainText('Trilha SQL');
    await expect(page.locator('#moduleSelector_sql')).toHaveCount(0);
  });

  test('some pro professor também, diferente do início/prazo por trilha', async ({ page }) => {
    await stubSupabaseFake(page, {
      bimestre_dates: [{ turma: 'sistemas', bimestre: 1, inicio: '2000-01-01', fim: '2000-03-31' }],
      trilha_release_dates: [{ turma: 'sistemas', trilha_key: 'sql', inicio: '2000-02-01' }],
    });
    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('.game-card:has-text("Banco de Dados")');

    await expect(page.locator('#materiaDetailArea')).not.toContainText('Trilha SQL');
    await expect(page.locator('#moduleSelector_sql')).toHaveCount(0);
  });

  test('trilha sem início definido nunca é afetada, mesmo com bimestres cadastrados', async ({ page }) => {
    await stubSupabaseFake(page, {
      bimestre_dates: [{ turma: 'sistemas', bimestre: 1, inicio: '2000-01-01', fim: '2000-03-31' }],
      trilha_release_dates: [],
    });
    await page.goto(SISTEMAS_ALUNO_URL);
    await page.click('.game-card:has-text("Banco de Dados")');

    await expect(page.locator('#materiaDetailArea')).toContainText('Trilha SQL');
  });
});

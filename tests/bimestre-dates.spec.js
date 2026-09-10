// @ts-check
// Calendário letivo por bimestre + liberação por trilha (aba Gestão,
// seção "Bloqueios e Liberações" → "Bimestres — Início e Fim" e
// "Liberação por Trilha"). Cada TRILHA (não matéria — a mesma matéria
// costuma ter trilhas em bimestres diferentes ao longo do ano) é
// atribuída a um bimestre; a janela [início, fim] desse bimestre vira o
// período em que a trilha fica visível/liberada. Passado o fim, a trilha
// some da aba Aulas pra todo mundo, inclusive o professor.
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
});

test.describe('Gestão — liberação por trilha (professor)', () => {
  test('lista todas as trilhas com a matéria dona e salva o bimestre atribuído a cada uma em lote', async ({ page }) => {
    await stubSupabaseFake(page, { trilha_bimestre: [] });
    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await expandGestaoSection(page, 'Bloqueios e Liberações');

    const row = page.locator('#tblGestaoTrilhasBody tr[data-trilha="sql"]');
    await expect(row).toContainText('Banco de Dados');
    await expect(row).toContainText('Sempre visível');

    await row.locator('select').selectOption('1');
    await page.click('#btnSalvarTrilhaBimestre');

    await expect(page.locator('#trilhaBimestreStatus')).toContainText('Salvo');
    const saved = await page.evaluate(() => window.__FAKE_DB__.trilha_bimestre || []);
    expect(saved.find(r => r.trilha_key === 'sql')).toMatchObject({ turma: 'sistemas', bimestre: 1 });
  });

  // Lê a estrutura de grupos da tabela direto do DOM: cada linha
  // .trilha-bimestre-group vira um cabeçalho novo, e as linhas de trilha
  // que vêm depois (até o próximo cabeçalho) entram na lista dele.
  async function readGroups(page) {
    return page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#tblGestaoTrilhasBody tr'));
      const out = {};
      let atual = null;
      rows.forEach(tr => {
        if (tr.classList.contains('trilha-bimestre-group')) {
          atual = tr.textContent.trim();
          out[atual] = [];
        } else if (tr.dataset.trilha) {
          out[atual].push(tr.dataset.trilha);
        }
      });
      return out;
    });
  }

  test('trilhas sem bimestre ficam num grupo separado, e escolher um bimestre agrupa a trilha com as demais do mesmo bimestre na hora, antes de salvar', async ({ page }) => {
    await stubSupabaseFake(page, {
      // "sql-comentarios" já começa no 1º Bimestre — as outras 2 trilhas de
      // Banco de Dados (sql, db-conexao-supabase) ainda não têm bimestre.
      trilha_bimestre: [{ turma: 'sistemas', trilha_key: 'sql-comentarios', bimestre: 1 }],
    });
    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await expandGestaoSection(page, 'Bloqueios e Liberações');

    const before = await readGroups(page);
    expect(before['Sem bimestre']).toEqual(expect.arrayContaining(['sql', 'db-conexao-supabase']));
    expect(before['1º Bimestre']).toEqual(['sql-comentarios']);

    // Escolhe o 1º Bimestre pra "sql" — reagrupa na hora, sem precisar
    // clicar em "Salvar" nem recarregar a tabela.
    await page.locator('#tblGestaoTrilhasBody tr[data-trilha="sql"] select').selectOption('1');

    const after = await readGroups(page);
    expect(after['1º Bimestre']).toEqual(expect.arrayContaining(['sql-comentarios', 'sql']));
    expect(after['Sem bimestre']).toContain('db-conexao-supabase');
    expect(after['Sem bimestre']).not.toContain('sql');
  });
});

test.describe('Trilha com bimestre encerrado', () => {
  test('some pro aluno, mas outra trilha da MESMA matéria sem bimestre atribuído continua visível', async ({ page }) => {
    await stubSupabaseFake(page, {
      bimestre_dates: [{ turma: 'sistemas', bimestre: 1, inicio: '2000-01-01', fim: '2000-03-31' }],
      trilha_bimestre: [{ turma: 'sistemas', trilha_key: 'sql', bimestre: 1 }],
    });
    await page.goto(SISTEMAS_ALUNO_URL);
    await page.click('.game-card:has-text("Banco de Dados")');

    await expect(page.locator('#materiaDetailArea')).not.toContainText('Trilha SQL');
    await expect(page.locator('#moduleSelector_sql')).toHaveCount(0);
    // "Documentação de Código" (sql-comentarios) é outra trilha da mesma
    // matéria "Banco de Dados", sem bimestre atribuído — nunca é afetada.
    await expect(page.locator('#materiaDetailArea')).toContainText('Documentação de Código');
  });

  test('some pro professor também, diferente do bloqueio antigo (início/prazo por trilha)', async ({ page }) => {
    await stubSupabaseFake(page, {
      bimestre_dates: [{ turma: 'sistemas', bimestre: 1, inicio: '2000-01-01', fim: '2000-03-31' }],
      trilha_bimestre: [{ turma: 'sistemas', trilha_key: 'sql', bimestre: 1 }],
    });
    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('.game-card:has-text("Banco de Dados")');

    await expect(page.locator('#materiaDetailArea')).not.toContainText('Trilha SQL');
    await expect(page.locator('#moduleSelector_sql')).toHaveCount(0);
  });

  test('trilha sem bimestre atribuído nunca é afetada, mesmo com bimestres cadastrados', async ({ page }) => {
    await stubSupabaseFake(page, {
      bimestre_dates: [{ turma: 'sistemas', bimestre: 1, inicio: '2000-01-01', fim: '2000-03-31' }],
      trilha_bimestre: [],
    });
    await page.goto(SISTEMAS_ALUNO_URL);
    await page.click('.game-card:has-text("Banco de Dados")');

    await expect(page.locator('#materiaDetailArea')).toContainText('Trilha SQL');
  });
});

test.describe('Trilha com bimestre futuro', () => {
  test('some pro aluno, mas o professor continua vendo (revisão de conteúdo)', async ({ page }) => {
    await stubSupabaseFake(page, {
      bimestre_dates: [{ turma: 'sistemas', bimestre: 1, inicio: '2999-01-01', fim: '2999-03-31' }],
      trilha_bimestre: [{ turma: 'sistemas', trilha_key: 'sql', bimestre: 1 }],
    });
    await page.goto(SISTEMAS_ALUNO_URL);
    await page.click('.game-card:has-text("Banco de Dados")');
    await expect(page.locator('#materiaDetailArea')).not.toContainText('Trilha SQL');

    await page.goto(SISTEMAS_PROFESSOR_URL);
    await page.click('.game-card:has-text("Banco de Dados")');
    await expect(page.locator('#materiaDetailArea')).toContainText('Trilha SQL');
  });
});

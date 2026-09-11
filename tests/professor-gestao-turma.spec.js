// @ts-check
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, jogosAlunoProfiles, expandGabaritoRow } = require('./helpers');

const JOGOS_URL = '/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos';
const ALUNO_URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos';

// As seções da aba Gestão vêm reduzidas por padrão — precisa expandir antes de mexer no conteúdo.
async function expandGestaoSection(page, titulo) {
  await page.locator('.collapsible-card .collapsible-head', { hasText: titulo }).click();
}

test.describe('Aba Gestão (só professor) dentro do portal da turma', () => {
  test('aluno não vê a aba Gestão', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ALUNO_URL);
    await expect(page.locator('#mainNavTabs .tab-btn[data-tab="gestao"]')).toHaveCount(0);
  });

  test('a aba Gestão rola de verdade quando o conteúdo passa de uma tela (regressão do scroll travado)', async ({ page }) => {
    // A aba Gestão é a mais alta do portal (vários cards empilhados) — se o
    // wrapper #app perder o display:flex, .viewport-content nunca fica
    // limitado à altura da tela e o scroll interno trava por completo
    // (nada rola, nem o mouse wheel resolve, mesmo a página não crescendo).
    await stubSupabaseFake(page, {});
    await page.setViewportSize({ width: 1300, height: 700 });
    await page.goto(JOGOS_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(300);

    // expande todas as seções pra recriar o cenário de conteúdo empilhado que causava o travamento
    const heads = page.locator('#tabContentGestao .collapsible-head');
    const count = await heads.count();
    for (let i = 0; i < count; i++) await heads.nth(i).click();
    await page.waitForTimeout(200);

    const before = await page.evaluate(() => {
      const vc = document.querySelector('.viewport-content');
      return { scrollTop: vc.scrollTop, scrollHeight: vc.scrollHeight, clientHeight: vc.clientHeight };
    });
    expect(before.scrollHeight).toBeGreaterThan(before.clientHeight); // conteúdo realmente maior que a tela

    await page.mouse.move(650, 400);
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(200);

    const scrollTopAfter = await page.evaluate(() => document.querySelector('.viewport-content').scrollTop);
    expect(scrollTopAfter).toBeGreaterThan(0);
  });

  // Liberação de jogos não é mais por aluno individual — só "Liberar Todos"/
  // "Bloquear Todos" pra turma inteira (student_overrides continua uma linha
  // por aluno por baixo dos panos, mas a Gestão só expõe o controle em lote).
  test('Liberar Todos / Bloquear Todos grava o override em lote e atualiza o status agregado', async ({ page }) => {
    await stubSupabaseFake(page, { student_overrides: [], profiles: jogosAlunoProfiles() });
    await page.goto(JOGOS_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await expandGestaoSection(page, 'Bloqueios e Liberações');

    await expect(page.locator('#gamesUnlockStatus')).toContainText('Bloqueado para todos');

    await page.click('#btnUnlockGamesTurma');
    await expect(page.locator('#gamesUnlockStatus')).toContainText('Liberado para todos');
    let rows = await page.evaluate(() => window.__FAKE_DB__.student_overrides || []);
    expect(rows.some(r => r.student_email === 'breno.silva80' && r.games_unlocked === true)).toBe(true);
    expect(rows.some(r => r.student_email === 'alexandre.natal')).toBe(false); // só alunos desta turma

    await page.click('#btnLockGamesTurma');
    await expect(page.locator('#gamesUnlockStatus')).toContainText('Bloqueado para todos');
    rows = await page.evaluate(() => window.__FAKE_DB__.student_overrides || []);
    expect(rows.every(r => r.games_unlocked === false)).toBe(true);
  });

  test('bloquear Ctrl+C/V grava configuração com id da turma, não "global"', async ({ page }) => {
    await stubSupabaseFake(page, { classroom_settings: [] });
    await page.goto(JOGOS_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await expandGestaoSection(page, 'Bloqueios e Liberações');

    await expect(page.locator('#btnToggleClipboard')).toContainText('Bloquear Copiar/Colar');
    await page.click('#btnToggleClipboard');
    await expect(page.locator('#btnToggleClipboard')).toContainText('BLOQUEADO');

    const rows = await page.evaluate(() => window.__FAKE_DB__.classroom_settings || []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'jogos', clipboard_blocked: true });
  });

  // Token temporário do professor pra "Dar visto"/"Pular etapa" dentro de
  // uma atividade (shared/professor-visto.js) — substitui digitar a senha
  // real numa tela que é fisicamente do aluno (ver PENDENCIAS.md). Fica
  // atrás do atalho "🔑 Token" na barra de navegação, não dentro da Gestão.
  test('gerar token do professor mostra um código de 6 dígitos com prazo, e reabrir o popover mantém o mesmo token', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(JOGOS_URL);

    await page.click('#btnQuickToken');
    await expect(page.locator('#professorTokenOverlay')).toBeVisible();
    await expect(page.locator('#professorTokenValue')).toHaveText('------');
    await page.click('#btnGerarProfessorToken');

    await expect(page.locator('#professorTokenValue')).toHaveText(/^\d{6}$/);
    await expect(page.locator('#professorTokenStatus')).toContainText('Expira em');

    const tokenGerado = await page.locator('#professorTokenValue').textContent();
    const rows = await page.evaluate(() => window.__FAKE_DB__.professor_tokens || []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ token: tokenGerado, created_by: 'fake-admin' });

    // Fechar e reabrir o popover não gera um token novo — mostra o mesmo,
    // senão qualquer navegação do professor invalidaria o token que um
    // aluno já pode estar digitando em outra atividade.
    await page.click('#btnFecharProfessorToken');
    await expect(page.locator('#professorTokenOverlay')).toBeHidden();
    await page.click('#btnQuickToken');
    await expect(page.locator('#professorTokenValue')).toHaveText(tokenGerado);
  });

  test('Gabarito lista a atividade e gera o .txt com pergunta + resposta esperada, sem abrir o módulo', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(JOGOS_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await expandGestaoSection(page, 'Gabarito');

    await expect(page.locator('#gestaoGabaritoList')).toContainText('Teoria — Multimídia e Versionamento');

    // a aba de Aulas & Atividades continua fechada — a geração não precisa abrir o módulo visível
    await expect(page.locator('#tabContentAulas')).toBeHidden();

    const multimidiaRow = await expandGabaritoRow(page, 'Teoria — Multimídia e Versionamento');
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      multimidiaRow.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('fund-multimidia-teoria-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('Depois de importar a imagem de um personagem pro projeto');
    expect(content).toContain('RESPOSTA ESPERADA: Associar a imagem a um objeto do jogo e definir sua posição/comportamento no código');

    await expect(page.locator('#tabContentAulas')).toBeHidden();
  });

  test('atalhos de acesso rápido (barra de navegação) só aparecem pro professor', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ALUNO_URL);
    await expect(page.locator('#btnQuickAtividadeInatividade')).toHaveCount(0);
    await expect(page.locator('#btnQuickToggleClipboard')).toHaveCount(0);
    await expect(page.locator('#btnQuickToken')).toHaveCount(0);
  });

  test('atalho "Atividade / Inatividade" abre a Gestão com "Relatórios" já expandido, sem precisar navegar manualmente', async ({ page }) => {
    await stubSupabaseFake(page, { student_overrides: [], profiles: jogosAlunoProfiles() });
    await page.goto(JOGOS_URL);

    // Ainda na aba Aulas & Atividades (tela padrão) — a Gestão nem foi aberta uma vez.
    await expect(page.locator('#tabContentGestao')).toBeHidden();

    await page.click('#btnQuickAtividadeInatividade');

    await expect(page.locator('#tabContentGestao')).toBeVisible();
    const relatorios = page.locator('.collapsible-card', { has: page.locator('h2', { hasText: 'Relatórios' }) });
    await expect(relatorios).toHaveClass(/expanded/);
    // "Atividade e Inatividade" (sub-seção de Relatórios) fica visível já expandida.
    await expect(page.locator('#inatividadeBody')).toBeVisible();
  });

  test('atalho de Ctrl+C/V liga/desliga o bloqueio da turma, e reflete o mesmo estado do botão dentro da Gestão', async ({ page }) => {
    await stubSupabaseFake(page, { classroom_settings: [] });
    await page.goto(JOGOS_URL);

    await expect(page.locator('#btnQuickToggleClipboard')).toHaveText('🔒 Bloquear Copiar/Colar');

    await page.click('#btnQuickToggleClipboard');
    await expect(page.locator('#btnQuickToggleClipboard')).toHaveText('🔓 Liberar Copiar/Colar');

    const rows = await page.evaluate(() => window.__FAKE_DB__.classroom_settings || []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'jogos', clipboard_blocked: true });

    // O botão de dentro da Gestão reflete o mesmo estado.
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await expandGestaoSection(page, 'Bloqueios e Liberações');
    await expect(page.locator('#btnToggleClipboard')).toContainText('BLOQUEADO');
  });

  test('status ao vivo (onde está, há quanto tempo) só aparece pra quem tem progresso real, e só alunos desta turma', async ({ page }) => {
    await stubSupabaseFake(page, {
      profiles: jogosAlunoProfiles(),
      student_activity: [
        { student_email: 'breno.silva80', student_name: 'Breno Silva', turma: 'jogos', status: 'active', location_label: 'JavaScript', updated_at: new Date().toISOString() },
        { student_email: 'alexandre.natal', student_name: 'Alexandre Natal', turma: 'sistemas', status: 'idle', location_label: 'Aulas', updated_at: new Date().toISOString() },
      ],
      student_module_progress: [
        { student_email: 'breno.silva80', turma: 'jogos', trilha_key: 'vida-autoconhecimento', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true },
      ],
    });
    await page.goto(JOGOS_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await expandGestaoSection(page, 'Relatórios');

    const row = page.locator('#inatividadeBody tr', { hasText: 'Breno Silva' });
    await expect(row).toContainText('Ativo');
    await expect(row).toContainText('JavaScript');

    // Alexandre é da turma Sistemas — não aparece na Gestão de Jogos.
    await expect(page.locator('#inatividadeBody')).not.toContainText('Alexandre Natal');
  });
});

// @ts-check
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, jogosAlunoProfiles } = require('./helpers');

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

  test('atalho de acesso rápido (barra de navegação) só aparece pro professor', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ALUNO_URL);
    await expect(page.locator('#btnQuickToken')).toHaveCount(0);
  });

  test('botão de Bloquear Copiar/Colar (dentro da Gestão) liga/desliga o bloqueio da turma', async ({ page }) => {
    await stubSupabaseFake(page, { classroom_settings: [] });
    await page.goto(JOGOS_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await expandGestaoSection(page, 'Bloqueios e Liberações');

    await expect(page.locator('#btnToggleClipboard')).toHaveText('Bloquear Copiar/Colar');

    await page.click('#btnToggleClipboard');
    await expect(page.locator('#btnToggleClipboard')).toContainText('BLOQUEADO');

    const rows = await page.evaluate(() => window.__FAKE_DB__.classroom_settings || []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'jogos', clipboard_blocked: true });
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

// Sino de alertas (fora da aba Gestão, sempre visível pro professor): avisa
// quando um aluno saiu 2x de uma atividade/prova bloqueada (ver
// shared/exam-proctor.js) e deixa o professor decidir Liberar ou Manter
// bloqueado — ver shared/platform-core.js, setupExamGuardAlerts().
test.describe('Sino de alertas de saída bloqueada (só professor)', () => {
  test('aluno não tem sino, e o professor sem alerta pendente não vê o selo', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ALUNO_URL);
    await expect(page.locator('#btnExamGuardAlerts')).toHaveCount(0);

    await stubSupabaseFake(page, {});
    await page.goto(JOGOS_URL);
    await expect(page.locator('#btnExamGuardAlerts')).toBeVisible();
    await expect(page.locator('#examGuardBadge')).toBeHidden();
  });

  test('mostra o selo com a contagem e a lista com o aluno/atividade certos', async ({ page }) => {
    await stubSupabaseFake(page, {
      profiles: jogosAlunoProfiles(),
      exam_guard_events: [
        { id: 'evt-1', student_email: 'breno.silva80', student_name: 'Breno Silva', turma: 'jogos', activity_location: 'prova_jogos', warnings: 2, resolved: false, created_at: new Date().toISOString() },
      ],
    });
    await page.goto(JOGOS_URL);

    await expect(page.locator('#examGuardBadge')).toBeVisible();
    await expect(page.locator('#examGuardBadge')).toHaveText('1');

    await page.click('#btnExamGuardAlerts');
    await expect(page.locator('#examGuardOverlay')).toBeVisible();
    const item = page.locator('.exam-guard-item');
    await expect(item).toContainText('Breno Silva');
    await expect(item).toContainText('Prova Jogos');
  });

  test('"Liberar" resolve o alerta e libera o bloqueio de verdade (student_activity_state)', async ({ page }) => {
    await stubSupabaseFake(page, {
      profiles: jogosAlunoProfiles(),
      exam_guard_events: [
        { id: 'evt-1', student_email: 'breno.silva80', student_name: 'Breno Silva', turma: 'jogos', activity_location: 'prova_jogos', warnings: 2, resolved: false, created_at: new Date().toISOString() },
      ],
    });
    await page.goto(JOGOS_URL);
    await page.click('#btnExamGuardAlerts');
    await page.click('.exam-guard-item button:has-text("Liberar")');

    await expect(page.locator('.exam-guard-item')).toHaveCount(0);
    await expect(page.locator('#examGuardOverlay')).toContainText('Nenhum alerta pendente');
    await expect(page.locator('#examGuardBadge')).toBeHidden();

    const [alert] = await page.evaluate(() => window.__FAKE_DB__.exam_guard_events);
    expect(alert).toMatchObject({ resolved: true, resolution: 'liberado', resolved_by: 'admin' });

    const guardState = await page.evaluate(() =>
      window.__FAKE_DB__.student_activity_state.find(r => r.student_email === 'breno.silva80' && r.progress_key === 'prova_jogos__guard')
    );
    expect(guardState.state).toMatchObject({ warnings: 0, blocked: false });
  });

  test('"Manter bloqueado" só marca o alerta como visto, sem mexer no bloqueio', async ({ page }) => {
    await stubSupabaseFake(page, {
      profiles: jogosAlunoProfiles(),
      exam_guard_events: [
        { id: 'evt-1', student_email: 'breno.silva80', student_name: 'Breno Silva', turma: 'jogos', activity_location: 'prova_jogos', warnings: 2, resolved: false, created_at: new Date().toISOString() },
      ],
    });
    await page.goto(JOGOS_URL);
    await page.click('#btnExamGuardAlerts');
    await page.click('.exam-guard-item button:has-text("Manter bloqueado")');

    await expect(page.locator('.exam-guard-item')).toHaveCount(0);
    const [alert] = await page.evaluate(() => window.__FAKE_DB__.exam_guard_events);
    expect(alert).toMatchObject({ resolved: true, resolution: 'mantido' });

    const guardState = await page.evaluate(() =>
      (window.__FAKE_DB__.student_activity_state || []).find(r => r.progress_key === 'prova_jogos__guard')
    );
    expect(guardState).toBeUndefined(); // "mantido" não toca em student_activity_state
  });

  test('um novo bloqueio chegando em tempo real mostra um toast e atualiza o selo', async ({ page }) => {
    await stubSupabaseFake(page, { profiles: jogosAlunoProfiles(), exam_guard_events: [] });
    await page.goto(JOGOS_URL);
    await expect(page.locator('#examGuardBadge')).toBeHidden();

    await page.evaluate(() => {
      window.__FAKE_DB__.exam_guard_events.push({
        id: 'evt-2', student_email: 'breno.silva80', student_name: 'Breno Silva', turma: 'jogos',
        activity_location: 'prova_jogos', warnings: 2, resolved: false, created_at: new Date().toISOString(),
      });
      window.__fireFakeRealtime('exam_guard_events');
    });

    const toast = page.locator('.pf-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Aluno bloqueado');
    await expect(toast).toContainText('Breno Silva');
    await expect(page.locator('#examGuardBadge')).toHaveText('1');
  });
});

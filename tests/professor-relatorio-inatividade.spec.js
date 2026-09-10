// @ts-check
// "Atividade e Inatividade" (dentro de "Relatórios", na aba Gestão) — junta
// dois relatórios que antes eram separados: mostra quem nunca acessou o
// portal e quem acessou mas não avançou em nenhuma atividade (pra o
// professor achar rápido quem precisa de um empurrão), e pra quem JÁ tem
// progresso real, mostra o status AO VIVO (Ativo/Inativo/Offline) mais
// onde está e há quanto tempo, em vez de um "ATIVO" genérico.
//
// "Acessou o portal" é aproximado por uma linha em student_activity (o
// heartbeat de shared/activity-tracker.js grava isso assim que a plataforma
// carrega). "Fez atividade" exige progress_current > 0 ou completed em
// ALGUM módulo de student_module_progress — só ter linha lá não basta,
// porque o sync roda pra todo módulo a cada carregamento, mesmo com 0%.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, sistemasAlunoProfiles } = require('./helpers');

const SISTEMAS_URL = '/turmas/sistemas/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=sistemas';

async function openGestao(page, seed) {
  await stubSupabaseFake(page, { ...seed, profiles: [...(seed.profiles || []), ...sistemasAlunoProfiles()] });
  await page.goto(SISTEMAS_URL);
  await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
  await page.waitForTimeout(200);
}

async function expandGestaoSection(page, titulo) {
  await page.locator('.collapsible-card .collapsible-head', { hasText: titulo }).click();
}

test.describe('Atividade e Inatividade — dentro do portal da turma', () => {
  test('classifica cada aluno como nunca acessou / sem atividade / status ao vivo (com onde está e há quanto tempo)', async ({ page }) => {
    await openGestao(page, {
      // alexandre.natal: nunca aparece em student_activity => nunca acessou.
      student_activity: [
        // bianca.bernardi: tem linha de presença no portal, mas nenhum módulo com progresso real.
        { student_email: 'bianca.bernardi', student_name: 'Bianca Bernardi', turma: 'sistemas', status: 'idle', location_label: 'Aulas', updated_at: '2026-08-10T12:00:00.000Z' },
        // bruno.gomes1: acessou E tem progresso de verdade — updated_at recente pra sair "Ativo" no status ao vivo.
        { student_email: 'bruno.gomes1', student_name: 'Bruno Gomes', turma: 'sistemas', status: 'active', location_label: 'SQL', updated_at: new Date().toISOString() },
      ],
      student_module_progress: [
        // linha existe mas com progresso zero — não deveria contar como "atividade".
        { student_email: 'bianca.bernardi', turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria', progress_current: 0, progress_total: 1, completed: false },
        { student_email: 'bruno.gomes1', turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true },
      ],
    });
    await expandGestaoSection(page, 'Relatórios');

    const rowFor = (nome) => page.locator('#inatividadeBody tr', { hasText: nome });

    await expect(rowFor('Alexandre Natal')).toContainText('NUNCA ACESSOU');
    await expect(rowFor('Bianca Bernardi')).toContainText('SEM ATIVIDADE');
    // Quem já tem progresso real mostra o status AO VIVO (não mais um "ATIVO" genérico), com onde está.
    await expect(rowFor('Bruno Gomes')).toContainText('Ativo');
    await expect(rowFor('Bruno Gomes')).toContainText('SQL');

    // Quem precisa de atenção vem antes de quem já está com progresso.
    const nomes = await page.locator('#inatividadeBody tr td:first-child').allTextContents();
    expect(nomes.indexOf('Alexandre Natal')).toBeLessThan(nomes.indexOf('Bruno Gomes'));
    expect(nomes.indexOf('Bianca Bernardi')).toBeLessThan(nomes.indexOf('Bruno Gomes'));

    await expect(page.locator('#inatividadeResumo')).toContainText('nunca acessaram o portal');
  });

  // Removido: "logado como professor, mas sbClient nulo" não é mais um
  // estado alcançável (mesmo motivo do teste equivalente removido em
  // tests/professor-relatorio-atividade-dia.spec.js) — login agora exige
  // Supabase Auth configurado.

  test('clicar no nome do aluno abre o Perfil dele (mesma tela que o aluno vê), com botão pra voltar', async ({ page }) => {
    await openGestao(page, {
      student_activity: [
        { student_email: 'bruno.gomes1', student_name: 'Bruno Gomes', turma: 'sistemas', status: 'active', location_label: 'SQL', updated_at: '2026-08-15T09:30:00.000Z' },
      ],
      student_module_progress: [
        { student_email: 'bruno.gomes1', turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true },
      ],
    });
    await expandGestaoSection(page, 'Relatórios');

    await page.click('#inatividadeBody tr:has-text("Bruno Gomes") .aluno-nome-link');

    await expect(page.locator('#tabContentPerfil')).toBeVisible();
    await expect(page.locator('#tabContentGestao')).toBeHidden();
    await expect(page.locator('#perfilTituloPrincipal')).toHaveText('Progresso de Bruno Gomes');
    // "Atividades Concluídas": 1 módulo concluído de N na turma inteira.
    await expect(page.locator('#perfilResumo')).toContainText('1/');

    await expect(page.locator('#btnVoltarPerfilAluno')).toBeVisible();
    await page.click('#btnVoltarPerfilAluno');

    await expect(page.locator('#tabContentGestao')).toBeVisible();
    await expect(page.locator('#tabContentPerfil')).toBeHidden();
  });

  test('trocar de aluno no relatório atualiza o Perfil mostrado, sem misturar progresso de outro aluno', async ({ page }) => {
    await openGestao(page, {
      student_activity: [
        { student_email: 'bruno.gomes1', student_name: 'Bruno Gomes', turma: 'sistemas', status: 'active', updated_at: '2026-08-15T09:30:00.000Z' },
        { student_email: 'alexandre.natal', student_name: 'Alexandre Natal', turma: 'sistemas', status: 'active', updated_at: '2026-08-15T09:30:00.000Z' },
      ],
      student_module_progress: [
        { student_email: 'bruno.gomes1', turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true },
      ],
    });
    await expandGestaoSection(page, 'Relatórios');

    await page.click('#inatividadeBody tr:has-text("Bruno Gomes") .aluno-nome-link');
    await expect(page.locator('#perfilTituloPrincipal')).toHaveText('Progresso de Bruno Gomes');
    await expect(page.locator('#perfilResumo')).toContainText('1/');

    // Volta e abre o Perfil de outro aluno, sem nenhum progresso — a tela
    // não pode continuar mostrando os dados do Bruno.
    await page.click('#btnVoltarPerfilAluno');
    await page.click('#inatividadeBody tr:has-text("Alexandre Natal") .aluno-nome-link');

    await expect(page.locator('#perfilTituloPrincipal')).toHaveText('Progresso de Alexandre Natal');
    await expect(page.locator('#perfilResumo')).toContainText('0/');
  });
});

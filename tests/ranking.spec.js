// @ts-check
// Ranking: o aluno vê a própria posição na turma (calculada a partir do %
// geral de conclusão em student_module_progress), mas nunca o nome ou a
// posição de outro colega — só o número da própria colocação e o total de
// alunos. O professor não vê o badge (não faz sentido pra ele).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

// Turma Jogos, matéria "Fundamentos de Programação" tem 3 módulos ao todo
// (js/basico progressTotal:5, js/intermediario progressTotal:7, csharp/basico
// progressTotal implícito 1) — usados como base do % geral.
//
// O progresso do PRÓPRIO aluno logado é lido do localStorage do navegador
// (syncAllModulesProgress roda no load e reescreve student_module_progress
// com isso) — por isso o progresso dele é semeado via localStorage abaixo,
// não na tabela. Só o progresso de OUTROS alunos (que nunca abrem essa
// sessão de navegador) fica estável vindo direto do seed do Supabase.
const SEED = {
  student_module_progress: [
    // edward.guzman: os 3 módulos 100% → 100% geral, fica na frente do breno.
    { student_email: 'edward.guzman', turma: 'jogos', trilha_key: 'js', module_key: 'basico', progress_current: 5, progress_total: 5, completed: true },
    { student_email: 'edward.guzman', turma: 'jogos', trilha_key: 'js', module_key: 'intermediario', progress_current: 7, progress_total: 7, completed: true },
    { student_email: 'edward.guzman', turma: 'jogos', trilha_key: 'csharp', module_key: 'basico', progress_current: 1, progress_total: 1, completed: true },
  ],
};

// breno.silva80 completou os 5 desafios de js/basico (progressTotal:5) e
// nada mais → média geral (100+0+0)/3 = 33.33% → arredonda 33%.
async function seedBrenoLocalProgress(page) {
  await page.addInitScript(() => {
    localStorage.setItem('js_basico_progress_breno.silva80', JSON.stringify([0, 1, 2, 3, 4]));
  });
}

test.describe('Ranking do aluno na turma', () => {
  test('aluno vê a própria posição, sem nome/posição de colegas na tela', async ({ page }) => {
    await stubSupabaseFake(page, SEED);
    await seedBrenoLocalProgress(page);
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');

    const badge = page.locator('#rankingBadge');
    await expect(badge).toBeVisible();
    // edward (100%) na frente, breno (33%) em 2º de 17 alunos da turma Jogos.
    await expect(badge).toHaveText('🏆 Sua posição na turma: 2º de 17 (33% concluído)');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Edward');
    expect(bodyText).not.toContain('edward.guzman');
  });

  test('professor não vê o badge de ranking', async ({ page }) => {
    await stubSupabaseFake(page, SEED);
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos');

    await expect(page.locator('#rankingBadge')).toBeHidden();
  });

  test('aluno no topo da turma vê a própria posição em 1º', async ({ page }) => {
    // Aqui é o edward.guzman quem está logado, então é o localStorage dele
    // (não a linha semeada no SEED, que syncAllModulesProgress reescreveria)
    // que decide o % geral: os 3 módulos 100% → 100% geral, 1º lugar.
    await stubSupabaseFake(page, SEED);
    await page.addInitScript(() => {
      localStorage.setItem('js_basico_progress_edward.guzman', JSON.stringify([0, 1, 2, 3, 4]));
      localStorage.setItem('js_intermediario_progress_edward.guzman', JSON.stringify([0, 1, 2, 3, 4, 5, 6]));
      localStorage.setItem('csharp_basico_progress_edward.guzman', JSON.stringify({ completed: true }));
    });
    await page.goto('/turmas/jogos/plataforma.html?user=edward.guzman&ip=192.168.1.11&saldo=1580.11&role=aluno&turma=jogos');

    await expect(page.locator('#rankingBadge')).toHaveText('🏆 Sua posição na turma: 1º de 17 (100% concluído)');
  });
});

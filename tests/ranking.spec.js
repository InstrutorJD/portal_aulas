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
    // O texto é só o essencial (troféu + posição); o detalhe completo vira title/tooltip.
    await expect(badge).toHaveText('🏆 2º');
    await expect(badge).toHaveAttribute('title', 'Sua posição na turma: 2º de 17 (33% concluído)');

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

    await expect(page.locator('#rankingBadge')).toHaveText('🏆 1º');
  });

  // Empate divide a mesma posição ("ranking de competição": 1, 2, 2, 4, ...)
  // — sem isso, um grupo de alunos com o mesmo % (0%, o caso mais comum no
  // início da turma) aparecia em posições diferentes só por causa de um
  // desempate alfabético interno, que não é ranking nenhum de verdade.
  test('alunos empatados em 0% dividem a mesma posição', async ({ page }) => {
    // SEED só dá progresso pro edward (100%) — breno e o resto da turma
    // (16 outros alunos) ficam em 0%, todos empatados.
    await stubSupabaseFake(page, SEED);
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');

    await expect(page.locator('#rankingBadge')).toHaveText('🏆 2º');
    await expect(page.locator('#rankingBadge')).toHaveAttribute('title', 'Sua posição na turma: 2º de 17 (0% concluído)');
  });

  test('vários grupos empatados: posição pula o tamanho do grupo (1, 2, 2, 4)', async ({ page }) => {
    const TIE_SEED = {
      student_module_progress: [
        // edward: 100% (3/3 módulos) — sozinho no topo.
        { student_email: 'edward.guzman', turma: 'jogos', trilha_key: 'js', module_key: 'basico', progress_current: 5, progress_total: 5, completed: true },
        { student_email: 'edward.guzman', turma: 'jogos', trilha_key: 'js', module_key: 'intermediario', progress_current: 7, progress_total: 7, completed: true },
        { student_email: 'edward.guzman', turma: 'jogos', trilha_key: 'csharp', module_key: 'basico', progress_current: 1, progress_total: 1, completed: true },
        // engel e gabriella: 67% cada (js/basico + csharp/basico, sem js/intermediario) — empatados em 2º.
        { student_email: 'engel.fraga', turma: 'jogos', trilha_key: 'js', module_key: 'basico', progress_current: 5, progress_total: 5, completed: true },
        { student_email: 'engel.fraga', turma: 'jogos', trilha_key: 'csharp', module_key: 'basico', progress_current: 1, progress_total: 1, completed: true },
        { student_email: 'gabriella.borges5', turma: 'jogos', trilha_key: 'js', module_key: 'basico', progress_current: 5, progress_total: 5, completed: true },
        { student_email: 'gabriella.borges5', turma: 'jogos', trilha_key: 'csharp', module_key: 'basico', progress_current: 1, progress_total: 1, completed: true },
        // iago: 33% (só csharp/basico) — sozinho em 4º (pula o 3º, ocupado pelo empate acima).
        { student_email: 'iago.moreira', turma: 'jogos', trilha_key: 'csharp', module_key: 'basico', progress_current: 1, progress_total: 1, completed: true },
      ],
    };
    await stubSupabaseFake(page, TIE_SEED);
    // breno não fez nada (0%) — empata com o resto da turma (13 alunos) em 5º.
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');

    await expect(page.locator('#rankingBadge')).toHaveText('🏆 5º');
  });
});

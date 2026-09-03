// @ts-check
// Aba "Perfil" (só do aluno): mostra o progresso geral, o progresso por
// matéria/trilha e a vitrine de insígnias do curso (turmas/jogos/config.js),
// progressivas por % geral de conclusão — sem tabela nova no Supabase, é
// tudo derivado de student_module_progress.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, jogosAlunoProfiles } = require('./helpers');

const ALUNO_URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos';
const PROFESSOR_URL = '/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos';

// Turma Jogos tem 62 módulos ao todo (mesma base de cálculo usada em
// ranking.spec.js). A matéria "Fundamentos de Programação" sozinha tem 19:
// js/basico, js/intermediario, os 4 módulos da trilha csharp (teoria,
// comparação, prática simples, desafios) e os 5 da trilha gdscript (os
// mesmos 4 + 'cenarios', só dela), e mais 4 trilhas (teoria+prática cada)
// de fundamentos gerais de jogos.
const SEED = {
  profiles: jogosAlunoProfiles(),
  student_module_progress: [
    { student_email: 'edward.guzman', turma: 'jogos', trilha_key: 'js', module_key: 'basico', progress_current: 5, progress_total: 5, completed: true },
    { student_email: 'edward.guzman', turma: 'jogos', trilha_key: 'js', module_key: 'intermediario', progress_current: 7, progress_total: 7, completed: true },
  ],
};

async function openPerfil(page) {
  await page.click('#mainNavTabs .tab-btn[data-tab="perfil"]');
}

test.describe('Aba Perfil (só aluno)', () => {
  test('professor não vê a aba Perfil', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(PROFESSOR_URL);
    await expect(page.locator('#mainNavTabs .tab-btn[data-tab="perfil"]')).toHaveCount(0);
  });

  test('aluno sem nenhum progresso salvo vê 0%, e a vitrine de insígnias aparece toda travada', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ALUNO_URL);
    await openPerfil(page);

    await expect(page.locator('#perfilResumo')).toContainText('0%');
    await expect(page.locator('#perfilBadgesGrid .badge-slot')).toHaveCount(6);
    await expect(page.locator('#perfilBadgesGrid')).toContainText('Iniciante');
    await expect(page.locator('#perfilBadgesGrid .badge-slot.unlocked')).toHaveCount(0);
  });

  test('mostra progresso geral, por matéria/trilha, a posição no ranking e desbloqueia insígnias por % de conclusão', async ({ page }) => {
    await stubSupabaseFake(page, SEED);
    // breno completa só js/basico (10/10) → 1 módulo concluído de 62 na turma
    // toda (2% geral), mas 5% dentro da matéria Fundamentos (1 de 19 módulos:
    // js básico+intermediário, os 4 módulos da trilha csharp, os 5 módulos
    // da trilha gdscript, e mais 4 trilhas teoria+prática de fundamentos
    // gerais de jogos).
    await page.addInitScript(() => {
      localStorage.setItem('js_basico_progress_breno.silva80', JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });
    await page.goto(ALUNO_URL);
    await openPerfil(page);

    const resumo = page.locator('#perfilResumo');
    await expect(resumo).toContainText('2%');
    await expect(resumo).toContainText('1/62');
    await expect(resumo).toContainText('2º'); // atrás só do edward, à frente do resto (0%)
    await expect(resumo).toContainText('Posição de 17');

    const materiaCard = page.locator('.perfil-materia-card', { hasText: 'Fundamentos de Programação' });
    await expect(materiaCard).toContainText('5%');
    await expect(materiaCard).toContainText('1/2'); // trilha JS: básico feito, intermediário não
    await expect(materiaCard).toContainText('0/2'); // trilhas fund-*: nada feito (teoria + prática)
    await expect(materiaCard).toContainText('0/4'); // trilha csharp: nada feito (teoria + comparação + prática simples + desafios)
    await expect(materiaCard).toContainText('0/5'); // trilha gdscript: nada feito (os mesmos 4 + cenários)

    // Progresso real: desbloqueia só "Iniciante" (minPct:0, exige progresso
    // real) — "Explorador" (minPct:20) ainda não.
    await expect(page.locator('#perfilBadgesGrid .badge-slot')).toHaveCount(6);
    await expect(page.locator('#perfilBadgesGrid .badge-slot.unlocked')).toHaveCount(1);
    const iniciante = page.locator('.badge-slot', { hasText: 'Iniciante' });
    await expect(iniciante).toHaveClass(/unlocked/);
    await expect(iniciante).toContainText('Deu o primeiro passo no mundo dos jogos!');
    const explorador = page.locator('.badge-slot', { hasText: 'Explorador' });
    await expect(explorador).not.toHaveClass(/unlocked/);
    const criador = page.locator('.badge-slot', { hasText: 'Criador' });
    await expect(criador).not.toHaveClass(/unlocked/);
    await expect(criador).toContainText('Alcance 40% de progresso');
  });

  test('trocar de aba pra Perfil não mexe no cadeado de Jogos', async ({ page }) => {
    await stubSupabaseFake(page, { daily_module_releases: [] });
    await page.goto(ALUNO_URL);
    await openPerfil(page);
    await expect(page.locator('#tabContentPerfil')).toBeVisible();
    await expect(page.locator('#tabBtnJogos')).toHaveClass(/disabled/);
  });
});

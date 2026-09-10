// @ts-check
// Organização das trilhas por status (shared/platform-core.js: trilhaStatus/
// visibleTrilhas/visibleTrilhasOrdered) — sem isso, o currículo de vários
// bimestres somados lotaria a tela do aluno com tudo junto, misturado.
//
// "Futura"/"encerrada" agora é sempre no nível da MATÉRIA (bimestre_dates +
// materia_bimestre, ver tests/bimestre-dates.spec.js pra cobertura
// detalhada) — não existe mais início/prazo por TRILHA individual nem
// grupo "Em atraso" (ver git history). Este arquivo cobre só o que ainda é
// por trilha: a ordenação/agrupamento dentro de uma matéria já visível
// (aberta vs. concluída).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

test.describe('Organização das trilhas (em aberto / concluídas)', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('trilha 100% concluída entra no grupo recolhido "Concluídas", sem sumir da lista', async ({ page }) => {
    await page.addInitScript(user => {
      localStorage.setItem(`vida_equipe_teoria_progress_${user}`, JSON.stringify({ completed: true }));
      localStorage.setItem(`vida_equipe_pratica_progress_${user}`, JSON.stringify([0, 1, 2, 3, 4]));
    }, 'breno.silva80');
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Projeto de Vida")');

    const select = page.locator('#trilhaSelect');
    await expect(select.locator('optgroup[label="✅ Concluídas"] option')).toHaveText(['Colaboração e Compromisso em Equipe']);
    // grupo "aberta" continua com as outras 4 trilhas não concluídas (as 2
    // trilhas individuais/visibleFor do Engel nem aparecem pra este aluno).
    await expect(select.locator('optgroup[label="🟢 Em aberto"] option')).toHaveCount(4);

    await select.selectOption('vida-equipe');
    await expect(page.locator('#moduleSelector_vida-equipe h2')).toContainText('Concluída');
  });

  test('matéria com o bimestre ainda não iniciado ganha o selo "Em breve", mesmo já tendo trilhas cadastradas', async ({ page }) => {
    await stubSupabaseFake(page, {
      bimestre_dates: [{ turma: 'jogos', bimestre: 1, inicio: '2999-01-01', fim: '2999-03-31' }],
      materia_bimestre: [{ turma: 'jogos', materia_key: 'intro-dev-projetos', bimestre: 1 }],
    });
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');

    const card = page.locator('.game-card:has-text("Introdução ao Desenvolvimento de Projetos")');
    await expect(card).toContainText('Em breve');

    // Continua clicável — só avisa que ainda não tem nada disponível, não trava.
    await card.click();
    await expect(page.locator('#aulasSubTabPages')).toContainText('Nenhuma trilha disponível nesta matéria no momento');
  });
});

// @ts-check
const { test, expect } = require('@playwright/test');
const { stubSupabaseDisabled, stubSupabaseFake } = require('./helpers');

const URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno';

// As trilhas de verdade (JS/C#) ficam dentro de Fundamentos de Programação —
// as demais 5 matérias de Jogos Digitais são placeholders vazios por enquanto.
async function openMateria1(page) {
  await page.click('.game-card:has-text("Fundamentos de Programação")');
}

test.describe('turmas/jogos/plataforma.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseDisabled(page);
  });

  test('mostra os cards das 6 matérias de Jogos Digitais', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#materiaCardGrid .game-card')).toHaveCount(6);
    await expect(page.locator('#materiaCardGrid')).toContainText('Fundamentos de Programação');
    await expect(page.locator('#materiaCardGrid')).toContainText('Testes de Jogos Digitais');
    // matéria vazia ganha o selo "Em breve"
    await expect(page.locator('.game-card:has-text("Mundo do Trabalho")')).toContainText('Em breve');
  });

  test('carrega tema, usuário e trilhas JS/C# dentro de Fundamentos de Programação', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#txtUserNom')).toHaveText('Breno Silva');
    await expect(page.locator('#txtUserTurma')).toHaveText('Jogos Digitais');

    await openMateria1(page);

    // 2 trilhas nessa matéria (JS/C#) — vira um <select> só, começando em "js".
    await expect(page.locator('#trilhaSelect')).toHaveValue('js');
    await expect(page.locator('#trilhaSelect option[value="csharp"]')).toHaveCount(1);

    // tema "hacker": --green deve ser o verde original, não o azul de Sistemas
    const green = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--green').trim());
    expect(green).toBe('#7cff3f');
  });

  test('aba Jogos começa bloqueada quando os módulos não foram concluídos', async ({ page }) => {
    await page.goto(URL);
    const tabJogos = page.locator('#tabBtnJogos');
    await expect(tabJogos).toHaveClass(/disabled/);
    await expect(tabJogos).toContainText('🔒');
    await expect(tabJogos).toHaveAttribute('title', /Bloqueado/);

    // clicar numa aba bloqueada não deve abrir os jogos
    page.once('dialog', d => d.accept());
    await tabJogos.click();
    await expect(page.locator('#tabContentJogos')).toBeHidden();
  });

  test('abrir e fechar um módulo de trilha troca a área visível', async ({ page }) => {
    await page.goto(URL);
    await openMateria1(page);
    await page.selectOption('#trilhaSelect', 'csharp');
    await expect(page.locator('#subTabContent_csharp')).toBeVisible();

    await page.click('#moduleSelector_csharp .game-card');
    await expect(page.locator('#moduleFrameArea_csharp')).toBeVisible();
    await expect(page.locator('#moduleSelector_csharp')).toBeHidden();
    await expect(page.locator('#moduleFrame_csharp')).toHaveAttribute(
      'src', /atividades\/csharp-basico\.html\?user=breno\.silva80/
    );

    await page.click('#moduleFrameArea_csharp .btn-secondary');
    await expect(page.locator('#moduleFrameArea_csharp')).toBeHidden();
    await expect(page.locator('#moduleSelector_csharp')).toBeVisible();
  });

  test('aba Jogos desbloqueia quando todos os módulos já foram concluídos', async ({ page }) => {
    await page.addInitScript(user => {
      localStorage.setItem(`js_basico_progress_${user}`, JSON.stringify([1, 2, 3, 4, 5]));
      localStorage.setItem(`js_intermediario_progress_${user}`, JSON.stringify([1, 2, 3, 4, 5, 6, 7]));
      localStorage.setItem(`csharp_basico_progress_${user}`, JSON.stringify({ completed: true }));
    }, 'breno.silva80');

    await page.goto(URL);
    const tabJogos = page.locator('#tabBtnJogos');
    await expect(tabJogos).not.toHaveClass(/disabled/);
    await expect(tabJogos).toContainText('🎮');

    await tabJogos.click();
    await expect(page.locator('#tabContentJogos')).toBeVisible();
    await expect(page.locator('#gameCardGrid .game-card')).toHaveCount(3);
  });
});

test.describe('turmas/jogos/plataforma.html — sincronização de progresso pro Supabase', () => {
  test('fechar um módulo manda o progresso pra student_module_progress', async ({ page }) => {
    await stubSupabaseFake(page, { student_module_progress: [] });
    await page.addInitScript(user => {
      localStorage.setItem(`csharp_basico_progress_${user}`, JSON.stringify({ completed: true }));
    }, 'breno.silva80');

    await page.goto(URL);
    await openMateria1(page);
    await page.selectOption('#trilhaSelect', 'csharp');
    await page.click('#moduleSelector_csharp .game-card');
    await expect(page.locator('#moduleFrameArea_csharp')).toBeVisible();

    await page.click('#moduleFrameArea_csharp .btn-secondary');
    await expect(page.locator('#moduleSelector_csharp')).toBeVisible();

    const rows = await page.evaluate(() => window.__FAKE_DB__.student_module_progress || []);
    const csharpRow = rows.find(r => r.trilha_key === 'csharp' && r.module_key === 'basico');
    expect(csharpRow).toMatchObject({
      student_email: 'breno.silva80',
      turma: 'jogos',
      progress_current: 1,
      progress_total: 1,
      completed: true
    });

    // js básico/intermediário nunca foram abertos, mas o sync do carregamento
    // inicial (init()) já deve ter mandado o estado 0/N deles também.
    const jsRow = rows.find(r => r.trilha_key === 'js' && r.module_key === 'basico');
    expect(jsRow).toMatchObject({ progress_current: 0, progress_total: 5, completed: false });
  });
});

// @ts-check
// Trilha individual "Projeto de Vida & Mundo do Trabalho (Engel)" —
// atividade adaptada, visível só pro aluno listado em trilha.visibleFor
// (config.js) e sempre pro professor (trilhaStatus() em
// shared/platform-core.js). Unifica os temas das 5 trilhas de "Projeto de
// Vida" + as 4 de "Mundo do Trabalho" numa trilha só (9 cenas, mesmo motor/
// estilo de ponto-de-virada-engel.html — emoji grande, 2 escolhas por cena,
// sem certo ou errado).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const PROFESSOR_URL = '/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos';
const ENGEL_URL = '/turmas/jogos/plataforma.html?user=engel.fraga&ip=192.168.1.20&saldo=1000.00&role=aluno&turma=jogos';
const BRENO_URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos';

async function openProjetoDeVida(page) {
  await page.click('.game-card:has-text("Projeto de Vida")');
}

test.describe('Trilha individual "Projeto de Vida & Mundo do Trabalho (Engel)"', () => {
  test('professor sempre vê a trilha, mesmo não estando na lista de visibleFor', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(PROFESSOR_URL);
    await openProjetoDeVida(page);
    await expect(page.locator('#trilhaSelect option[value="vida-trabalho-engel"]')).toHaveCount(1);
  });

  test('engel.fraga vê a própria trilha e consegue abrir o módulo', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await openProjetoDeVida(page);
    await expect(page.locator('#trilhaSelect option[value="vida-trabalho-engel"]')).toHaveCount(1);

    await page.selectOption('#trilhaSelect', 'vida-trabalho-engel');
    await expect(page.locator('#subTabContent_vida-trabalho-engel')).toBeVisible();
    await page.click('#moduleSelector_vida-trabalho-engel .game-card');
    await expect(page.locator('#moduleFrame_vida-trabalho-engel')).toHaveAttribute(
      'src', /atividades\/vida-trabalho-engel\.html\?user=engel\.fraga/
    );
  });

  test('outro aluno (fora da lista) não vê a trilha', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(BRENO_URL);
    await openProjetoDeVida(page);
    await expect(page.locator('#trilhaSelect option[value="vida-trabalho-engel"]')).toHaveCount(0);
  });

  test('joga as 9 cenas escolhendo sempre a 1ª opção, com callback de tag e final "cresceu com apoio"', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await openProjetoDeVida(page);
    await page.selectOption('#trilhaSelect', 'vida-trabalho-engel');
    await page.click('#moduleSelector_vida-trabalho-engel .game-card');

    const frame = page.frameLocator('#moduleFrame_vida-trabalho-engel');
    await expect(frame.locator('#btnStart')).toBeVisible();
    await frame.locator('#btnStart').click();

    await expect(frame.locator('.tag-label')).toHaveText('Autoconhecimento');
    await expect(frame.locator('#lblProgress')).toHaveText('0/9');

    for (let i = 0; i < 9; i++) {
      await frame.locator('.choice-btn').first().click();
      await expect(frame.locator('.reaction.show')).toBeVisible();
      // Cena 7 (Inovação) referencia a tag 'criativo' escolhida na cena 1.
      if (i === 6) {
        await expect(frame.locator('.scene p')).toContainText('Ele já sabe que gosta de inventar coisas');
      }
      await frame.locator('#btnNext').click();
    }

    await expect(frame.locator('.end-card h2')).toHaveText('Fim da jornada!');
    await expect(frame.locator('.end-card p')).toContainText('Lucas cresceu com calma, organização e gente por perto');
    await expect(frame.locator('#lblProgress')).toHaveText('9/9');

    const progress = await page.evaluate(
      u => JSON.parse(localStorage.getItem(`vida_trabalho_engel_progress_${u}`)),
      'engel.fraga'
    );
    expect(progress).toEqual({ completed: true });
  });

  test('escolher sempre a 2ª opção também conclui, com final diferente ("do jeito dele")', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await openProjetoDeVida(page);
    await page.selectOption('#trilhaSelect', 'vida-trabalho-engel');
    await page.click('#moduleSelector_vida-trabalho-engel .game-card');

    const frame = page.frameLocator('#moduleFrame_vida-trabalho-engel');
    await frame.locator('#btnStart').click();

    for (let i = 0; i < 9; i++) {
      await frame.locator('.choice-btn').nth(1).click();
      await expect(frame.locator('.reaction.show')).toBeVisible();
      await frame.locator('#btnNext').click();
    }

    await expect(frame.locator('.end-card p')).toContainText('Lucas cresceu resolvendo tudo do jeito dele');
  });
});

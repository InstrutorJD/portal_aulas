// @ts-check
// Trilha "Conectividade de Hardware" (matéria Internet das Coisas, turma
// Sistemas): 1 teoria (história + quiz, shared/quiz-teoria-engine.js) e 1
// prática ("chamados" de múltipla escolha, mesmo formato de
// redes-conexao-pratica.html).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

// A ordem das opções (A/B/C/D) é embaralhada a cada renderização — não dá
// pra usar STEPS[...].correctIndex como posição na tela, precisa achar a
// opção pelo texto (ver comentário equivalente em tests/redes-computadores.spec.js).
async function completeTeoria(page) {
  const total = await page.evaluate(() => STEPS.length);
  for (let i = 0; i < total; i++) {
    await page.click('#btnNext');
    const correctText = await page.evaluate(() => {
      const q = STEPS[stepOrder[currentStepIndex]].question;
      return q.options[q.correctIndex];
    });
    const options = page.locator('.option');
    const count = await options.count();
    let idx = 0;
    for (let j = 0; j < count; j++) {
      if ((await options.nth(j).innerText()).includes(correctText)) { idx = j; break; }
    }
    await options.nth(idx).click();
    await page.click('#btnNextAfterAnswer');
  }
}

test.describe('turmas/sistemas/atividades — trilha Conectividade de Hardware (Internet das Coisas)', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('aparece em Internet das Coisas, com a prática travada até a teoria ser concluída', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Internet das Coisas")');
    await expect(page.locator('#moduleSelector_iot-conectividade-hardware')).toContainText('Teoria');

    const praticaCard = page.locator('#moduleSelector_iot-conectividade-hardware .game-card', { hasText: 'Prática' });
    await expect(praticaCard).toHaveClass(/locked/);
    await expect(praticaCard).toContainText('Bloqueado');
  });

  test('teoria de Conectividade de Hardware conclui e marca progresso', async ({ page }) => {
    await page.goto('/turmas/sistemas/atividades/iot-conectividade-teoria.html?user=alexandre.natal&role=aluno&turma=sistemas');
    await completeTeoria(page);
    await expect(page.locator('.finish-screen')).toBeVisible();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('iot_conectividade_teoria_progress_alexandre.natal')));
    expect(stored.completed).toBe(true);
  });

  test('prática de Conectividade resolve os 5 chamados, incluindo retry após resposta errada', async ({ page }) => {
    await page.goto('/turmas/sistemas/atividades/iot-conectividade-pratica.html?user=alexandre.natal&role=aluno&turma=sistemas');
    await page.waitForSelector('#optionsPanel .option');

    // chamado 1: clica errado primeiro, confirma que não resolve e permite tentar de novo
    await page.locator('.option').nth(1).click();
    await expect(page.locator('#ticketStatus')).toHaveText('PENDENTE');
    await expect(page.locator('.console .line.fail')).toBeVisible();

    for (let i = 0; i < 5; i++) {
      const correctIdx = await page.evaluate(() => CHALLENGES.find(c => c.id === selectedId).correctIndex);
      await page.locator('.option').nth(correctIdx).click();
      await expect(page.locator('#ticketStatus')).toHaveText('RESOLVIDO');
      if (i < 4) await page.click('#btnNext');
    }

    await expect(page.locator('#lblProgress')).toHaveText('5/5');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('iot_conectividade_pratica_progress_alexandre.natal')));
    expect(stored.sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

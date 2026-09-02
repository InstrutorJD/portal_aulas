// @ts-check
// Trilha "Roteiros de Teste (Engel)" (Testes de Jogos Digitais, turma Jogos):
// módulo "Questionário — Cor e Título (Adaptado)" — mostra uma cor (as
// mesmas dos slides de atividades/teste-roteiros-trabalho-engel.html) e
// pede pra escolher, entre 4 opções, qual título usa essa cor. Só libera
// depois do visto do "Trabalho" (mesma trilha) e conclui sozinho ao fim das
// 8 perguntas, sem % mínimo de acerto.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const QUESTIONARIO_URL = '/turmas/jogos/atividades/teste-roteiros-questionario-engel.html?user=engel.fraga&role=aluno&turma=jogos';
const PROFESSOR_QUESTIONARIO_URL = '/turmas/jogos/atividades/teste-roteiros-questionario-engel.html?user=admin&role=professor&turma=jogos';

const SEED = {
  profiles: [
    { id: 'fake-engel.fraga', email: 'engel.fraga', nome: 'Engel Fraga', role: 'aluno', turma: 'jogos' },
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
};

async function seedTrabalhoConcluido(page) {
  await page.addInitScript(() => {
    localStorage.setItem('teste_roteiros_trabalho_engel_progress_engel.fraga', JSON.stringify({ completed: true, vistoPor: 'Instrutor / Professor', vistoEm: new Date().toISOString() }));
  });
}

test.describe('turmas/jogos — trilha Roteiros de Teste (Engel)', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('aparece em Testes de Jogos Digitais pro engel.fraga, com o Questionário travado até o visto do Trabalho', async ({ page }) => {
    await page.goto('/turmas/jogos/plataforma.html?user=engel.fraga&ip=192.168.1.20&saldo=1000.00&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Testes de Jogos Digitais")');
    await page.selectOption('#trilhaSelect', 'teste-roteiros-engel');
    await expect(page.locator('#moduleSelector_teste-roteiros-engel')).toContainText('Criar Slides no Canva');

    const questionarioCard = page.locator('#moduleSelector_teste-roteiros-engel .game-card', { hasText: 'Questionário' });
    await expect(questionarioCard).toHaveClass(/locked/);
    await expect(questionarioCard).toContainText('Bloqueado');
  });

  test('mostra a apresentação e depois 8 perguntas de cor → título, revelando a resposta certa mesmo quando erra', async ({ page }) => {
    await seedTrabalhoConcluido(page);
    await page.goto(QUESTIONARIO_URL);

    await expect(page.locator('#lblStepTotal')).toHaveText('10');
    await expect(page.locator('.card h2')).toContainText('Vamos relacionar cor e título');
    await page.click('#stepWrap button:has-text("Começar")');

    for (let i = 0; i < 8; i++) {
      await expect(page.locator('.card h2')).toContainText(`Pergunta ${i + 1}`);
      await expect(page.locator('.swatch')).toBeVisible();

      // Clica na 1ª opção — pode ser certa ou errada, mas o feedback e a
      // opção certa (.correct) sempre precisam aparecer em seguida.
      await page.locator('.option').first().click();
      await expect(page.locator('.feedback')).toBeVisible();
      await expect(page.locator('.option.correct')).toHaveCount(1);
      await page.click('#stepWrap button:has-text("Próximo")');
    }

    await expect(page.locator('.card h2')).toContainText('Você terminou!');
    await expect(page.locator('.score')).toContainText('/8');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('teste_roteiros_questionario_engel_progress_engel.fraga')));
    expect(stored.completed).toBe(true);
    expect(stored.respostas).toHaveLength(8);
    expect(stored.respostas.every(r => r !== null)).toBe(true);
  });

  test('não deixa responder de novo a mesma pergunta recarregando a página — resume na próxima', async ({ page }) => {
    await seedTrabalhoConcluido(page);
    await page.addInitScript(() => {
      localStorage.setItem('teste_roteiros_questionario_engel_progress_engel.fraga', JSON.stringify({
        iniciado: true,
        respostas: [true, null, null, null, null, null, null, null],
        completed: false,
        correctCount: 1
      }));
    });
    await page.goto(QUESTIONARIO_URL);

    await expect(page.locator('.card h2')).toContainText('Pergunta 2');
    await expect(page.locator('#lblStepNum')).toHaveText('3');
  });

  test('professor vê o botão "Pular (professor)" e consegue avançar sem responder', async ({ page }) => {
    await page.goto(PROFESSOR_QUESTIONARIO_URL);
    await page.click('#stepWrap button:has-text("Começar")');

    await expect(page.locator('.card h2')).toContainText('Pergunta 1');
    await expect(page.locator('#btnSkipProfessor')).toBeVisible();
    await page.click('#btnSkipProfessor');
    await expect(page.locator('.card h2')).toContainText('Pergunta 2');
  });
});

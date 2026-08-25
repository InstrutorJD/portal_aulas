// @ts-check
// Trilha "JavaScript" (matéria Desenvolvimento de Sistemas 1, turma
// Sistemas) — desafios de fundamentos: declarar variável, somar, dividir,
// mostrar no console, criar função, retornar valor de função e if/else.
// Mesmo motor de turmas/jogos/atividades/js-basico.html (barra lateral com
// progressão trancada, editor + botão Executar, console de resultado), só
// que cada desafio testa o código do aluno de um jeito diferente conforme
// `check.type` ('variable'/'console'/'function') — ver js-fundamentos-pratica.html.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const URL = '/turmas/sistemas/atividades/js-fundamentos-pratica.html?user=alexandre.natal&role=aluno&name=Alexandre%20Natal&turma=sistemas';

// Código correto de cada um dos 7 desafios, na ordem.
const SOLUTIONS = [
  'let resultado = 100;',
  'let resultado = a + b;',
  'let resultado = a / b;',
  'console.log(idade);',
  'function saudacao() {\n  return "Olá!";\n}',
  'function dobro(n) {\n  return n * 2;\n}',
  'let resultado;\nif (idade >= 18) {\n  resultado = "maior de idade";\n} else {\n  resultado = "menor de idade";\n}',
];

async function solveCurrent(page, code) {
  await page.fill('#codeInput', code);
  await page.click('#btnRun');
}

test.describe('turmas/sistemas/atividades/js-fundamentos-pratica.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('carrega travado a partir do 2º desafio, e o desafio 1 já vem com o enunciado certo', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 1: Guardando um valor');
    await expect(page.locator('#challengeDesc')).toContainText('resultado');
    await expect(page.locator('.challenge-item').nth(1)).toHaveClass(/locked/);
  });

  test('resolve os 7 desafios em sequência (variável, console.log e função) e conclui a trilha', async ({ page }) => {
    await page.goto(URL);

    for (let i = 0; i < SOLUTIONS.length; i++) {
      await solveCurrent(page, SOLUTIONS[i]);
      await expect(page.locator('#consoleOutput')).toContainText('✅');

      const isLast = i === SOLUTIONS.length - 1;
      if (isLast) {
        await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
      } else {
        await page.click('#btnNext');
      }
    }

    await expect(page.locator('#lblProgress')).toHaveText('7/7');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`js_fundamentos_pratica_progress_${u}`)), 'alexandre.natal');
    expect(progress).toHaveLength(7);
  });

  test('desafio de console.log não passa se o código só cria a variável sem chamar console.log', async ({ page }) => {
    await page.goto(URL);
    for (let i = 0; i < 3; i++) {
      await solveCurrent(page, SOLUTIONS[i]);
      await page.click('#btnNext');
    }
    // Agora no desafio 4 ("Mostrando na tela") — só atribui, não usa console.log.
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 4: Mostrando na tela');
    await solveCurrent(page, 'let resultado = idade;');
    await expect(page.locator('#consoleOutput')).toContainText('console.log não foi chamado');
    await expect(page.locator('#btnNext')).toBeHidden();
  });

  test('desafio de função não passa se a função não foi criada com o nome certo', async ({ page }) => {
    await page.goto(URL);
    for (let i = 0; i < 4; i++) {
      await solveCurrent(page, SOLUTIONS[i]);
      await page.click('#btnNext');
    }
    // Agora no desafio 5 ("Criando uma função").
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 5: Criando uma função');
    await solveCurrent(page, 'let saudacao = "Olá!";'); // não é uma função
    await expect(page.locator('#consoleOutput')).toContainText("a função 'saudacao' não foi criada");
  });

  test('desafio de retorno cobra o valor de volta pra vários argumentos, não só um caso fixo', async ({ page }) => {
    await page.goto(URL);
    for (let i = 0; i < 5; i++) {
      await solveCurrent(page, SOLUTIONS[i]);
      await page.click('#btnNext');
    }
    // Agora no desafio 6 ("Retornando um valor").
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 6: Retornando um valor');
    // Função que só funciona pra n=5 (hardcoded) falha nos outros casos de teste.
    await solveCurrent(page, 'function dobro(n) {\n  return 10;\n}');
    await expect(page.locator('#consoleOutput')).toContainText('❌');
    await expect(page.locator('#btnNext')).toBeHidden();
  });

  test('gabarito lista os 7 desafios com o critério de avaliação certo pra cada tipo de checagem', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/sistemas/plataforma.html?user=admin&ip=192.168.2.254&saldo=9999.00&role=professor&turma=sistemas');
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = page.locator('#gestaoGabaritoList > div', { hasText: 'Desafios de JavaScript' });
    await expect(row).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('js-fundamentos-pratica-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    // check.type: 'variable'
    expect(content).toContain('a = 2, b = 3 → resultado deve ser 5');
    // check.type: 'console'
    expect(content).toContain('idade = 10 → console.log deve mostrar 10');
    // check.type: 'function'
    expect(content).toContain('saudacao() deve retornar "Olá!"');
    expect(content).toContain('dobro(5) deve retornar 10');
  });

  test('aparece na matéria Desenvolvimento de Sistemas 1, dentro da própria trilha', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Desenvolvimento de Sistemas 1")');
    await page.selectOption('#trilhaSelect', 'js-fundamentos');
    await expect(page.locator('#moduleSelector_js-fundamentos')).toContainText('Desafios de JavaScript');
  });
});

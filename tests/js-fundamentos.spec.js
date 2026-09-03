// @ts-check
// Trilha "JavaScript" (matéria Desenvolvimento de Sistemas 1, turma
// Sistemas), agora em 2 módulos — mesmo padrão de turmas/jogos (js-basico.
// html/js-intermediario.html), ambos rodando sobre
// shared/js-challenge-engine.js:
//   Básico (10): Variável (5) + Console/Alert (5)
//   Intermediário (15): Função (5) + If/Else (5) + Laços (5)
// Cada desafio testa o código do aluno de um jeito diferente conforme
// `check.type` ('variable'/'console'/'function') — ver
// turmas/sistemas/atividades/js-fundamentos-basico.html e -intermediario.html.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, expandGabaritoRow } = require('./helpers');

const BASICO_URL = '/turmas/sistemas/atividades/js-fundamentos-basico.html?user=alexandre.natal&role=aluno&name=Alexandre%20Natal&turma=sistemas';
const INTERMEDIARIO_URL = '/turmas/sistemas/atividades/js-fundamentos-intermediario.html?user=alexandre.natal&role=aluno&name=Alexandre%20Natal&turma=sistemas';

const SOLUTIONS_BASICO = [
  'let resultado = 100;',
  'let resultado = "JavaScript";',
  'let resultado = a + b;',
  'let resultado = a / b;',
  'let resultado = pontos + 10;',
  'console.log(idade);',
  'console.log("Olá, mundo!");',
  'alert(nome);',
  'console.log(a + b);',
  'console.log("Total:");\nconsole.log(total);',
];

const SOLUTIONS_INTERMEDIARIO = [
  'function saudacao() {\n  return "Olá!";\n}',
  'function dobro(n) {\n  return n * 2;\n}',
  'function aumentar(n) {\n  return n + 10;\n}',
  'function soma(a, b) {\n  return a + b;\n}',
  'function multiplica(a, b) {\n  return a * b;\n}',
  'let resultado;\nif (idade >= 18) {\n  resultado = "maior de idade";\n} else {\n  resultado = "menor de idade";\n}',
  'let resultado;\nif (numero % 2 === 0) {\n  resultado = "par";\n} else {\n  resultado = "ímpar";\n}',
  'let resultado;\nif (nota >= 6) {\n  resultado = "aprovado";\n} else {\n  resultado = "reprovado";\n}',
  'let resultado;\nif (numero > 0) {\n  resultado = "positivo";\n} else {\n  resultado = "não positivo";\n}',
  'let resultado;\nif (saldo >= preco) {\n  resultado = "liberado";\n} else {\n  resultado = "insuficiente";\n}',
  'for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}',
  'for (let i = 1; i <= limite; i++) {\n  console.log(i);\n}',
  'let resultado = 0;\nfor (let i = 1; i <= n; i++) {\n  resultado = resultado + i;\n}',
  'let resultado = 0;\nfor (let i = 1; i <= n; i++) {\n  if (i % 2 === 0) {\n    resultado = resultado + 1;\n  }\n}',
  'for (let i = 1; i <= 5; i++) {\n  console.log(numero * i);\n}',
];

async function solveCurrent(page, code) {
  await page.fill('#codeInput', code);
  await page.click('#btnRun');
}

async function solveAll(page, solutions) {
  for (let i = 0; i < solutions.length; i++) {
    await solveCurrent(page, solutions[i]);
    await expect(page.locator('#consoleOutput')).toContainText('✅');
    if (i < solutions.length - 1) await page.click('#btnNext');
  }
}

async function downloadGabarito(page, moduleTitleHint, expectedFileName) {
  await stubSupabaseFake(page, {});
  await page.goto('/turmas/sistemas/plataforma.html?user=admin&ip=192.168.2.254&saldo=9999.00&role=professor&turma=sistemas');
  await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
  await page.waitForTimeout(200);
  await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

  const row = await expandGabaritoRow(page, moduleTitleHint);
  await expect(row).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    row.locator('[data-gabarito-mod]').click(),
  ]);
  expect(download.suggestedFilename()).toBe(expectedFileName);

  const filePath = await download.path();
  const fs = require('node:fs');
  return fs.readFileSync(filePath, 'utf-8');
}

test.describe('turmas/sistemas/atividades/js-fundamentos-basico.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('carrega travado a partir do 2º desafio, com o desafio 1 já certo', async ({ page }) => {
    await page.goto(BASICO_URL);
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 1: Guardando um número');
    await expect(page.locator('.challenge-item').nth(1)).toHaveClass(/locked/);
  });

  test('resolve os 10 desafios (variável, console e alert) em sequência e conclui o módulo', async ({ page }) => {
    await page.goto(BASICO_URL);
    await solveAll(page, SOLUTIONS_BASICO);
    await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
    await expect(page.locator('#lblProgress')).toHaveText('10/10');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`js_fundamentos_basico_progress_${u}`)), 'alexandre.natal');
    expect(progress).toHaveLength(10);
  });

  test('desafio de console não passa só atribuindo a variável, sem chamar console.log', async ({ page }) => {
    await page.goto(BASICO_URL);
    for (let i = 0; i < 5; i++) {
      await solveCurrent(page, SOLUTIONS_BASICO[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 6: Mostrando uma variável no console');
    await solveCurrent(page, 'let resultado = idade;');
    await expect(page.locator('#consoleOutput')).toContainText('nada foi exibido');
    await expect(page.locator('#btnNext')).toBeHidden();
  });

  test('desafio de alert é capturado pelo motor de testes, sem travar num popup de verdade', async ({ page }) => {
    await page.goto(BASICO_URL);
    for (let i = 0; i < 7; i++) {
      await solveCurrent(page, SOLUTIONS_BASICO[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 8: Usando o alert');
    await solveCurrent(page, SOLUTIONS_BASICO[7]);
    await expect(page.locator('#consoleOutput')).toContainText('✅');
    await expect(page.locator('#btnNext')).toBeVisible();
  });

  test('gabarito do Básico lista os 10 desafios com o critério certo pra cada tipo de checagem', async ({ page }) => {
    const content = await downloadGabarito(page, 'Básico — Desafios de JavaScript', 'js-fundamentos-basico-gabarito.txt');
    expect(content).toContain('GABARITO');
    expect(content).toContain('a = 2, b = 3 → resultado deve ser 5'); // variable
    expect(content).toContain('idade = 10 → console/alert deve mostrar [10]'); // console
    expect(content).toContain('nome = "Ana" → console/alert deve mostrar ["Ana"]'); // alert
  });
});

test.describe('turmas/sistemas/atividades/js-fundamentos-intermediario.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('carrega travado a partir do 2º desafio, com o desafio 1 já certo', async ({ page }) => {
    await page.goto(INTERMEDIARIO_URL);
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 1: Criando uma função');
    await expect(page.locator('.challenge-item').nth(1)).toHaveClass(/locked/);
  });

  test('resolve os 15 desafios (função, if/else e laços) em sequência e conclui o módulo', async ({ page }) => {
    await page.goto(INTERMEDIARIO_URL);
    await solveAll(page, SOLUTIONS_INTERMEDIARIO);
    await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
    await expect(page.locator('#lblProgress')).toHaveText('15/15');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`js_fundamentos_intermediario_progress_${u}`)), 'alexandre.natal');
    expect(progress).toHaveLength(15);
  });

  test('desafio de função não passa se a função não foi criada com o nome certo', async ({ page }) => {
    await page.goto(INTERMEDIARIO_URL);
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 1: Criando uma função');
    await solveCurrent(page, 'let saudacao = "Olá!";'); // não é uma função
    await expect(page.locator('#consoleOutput')).toContainText("a função 'saudacao' não foi criada");
  });

  test('desafio de if/else cobra os dois caminhos, não só um caso fixo', async ({ page }) => {
    await page.goto(INTERMEDIARIO_URL);
    for (let i = 0; i < 5; i++) {
      await solveCurrent(page, SOLUTIONS_INTERMEDIARIO[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 6: Maioridade');
    // Sempre retorna "maior de idade", então falha no teste com idade menor.
    await solveCurrent(page, 'let resultado = "maior de idade";');
    await expect(page.locator('#consoleOutput')).toContainText('❌');
    await expect(page.locator('#btnNext')).toBeHidden();
  });

  test('desafio de laço cobra vários valores de n, não só um caso hardcoded', async ({ page }) => {
    await page.goto(INTERMEDIARIO_URL);
    for (let i = 0; i < 12; i++) {
      await solveCurrent(page, SOLUTIONS_INTERMEDIARIO[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 13: Somando com um laço');
    // Só funciona pro caso n=3 (soma 1+2+3=6), hardcoded em vez de somar de verdade.
    await solveCurrent(page, 'let resultado = 6;');
    await expect(page.locator('#consoleOutput')).toContainText('❌');
    await expect(page.locator('#btnNext')).toBeHidden();
  });

  test('gabarito do Intermediário lista os 15 desafios com o critério certo pra cada tipo de checagem', async ({ page }) => {
    const content = await downloadGabarito(page, 'Intermediário — Desafios de JavaScript', 'js-fundamentos-intermediario-gabarito.txt');
    expect(content).toContain('GABARITO');
    expect(content).toContain('saudacao() deve retornar "Olá!"'); // function
    expect(content).toContain('dobro(5) deve retornar 10'); // function
    expect(content).toContain('idade = 18 → resultado deve ser "maior de idade"'); // variable (if/else)
    expect(content).toContain('console/alert deve mostrar [1,2,3,4,5]'); // console (laço)
  });
});

test.describe('turmas/sistemas/plataforma.html — trilha JavaScript', () => {
  test('aparece na matéria Desenvolvimento de Sistemas 1, com os módulos Básico e Intermediário', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Desenvolvimento de Sistemas 1")');
    await page.selectOption('#trilhaSelect', 'js-fundamentos');
    await expect(page.locator('#moduleSelector_js-fundamentos')).toContainText('Básico — Desafios de JavaScript');
    await expect(page.locator('#moduleSelector_js-fundamentos')).toContainText('Intermediário — Desafios de JavaScript');
  });
});

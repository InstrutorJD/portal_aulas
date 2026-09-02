// @ts-check
// Trilha "C#" (matéria Fundamentos de Programação de Jogos, turma Jogos
// Digitais): Teoria (quiz-teoria-engine.js) + 2 práticas de código sobre
// shared/csharp-challenge-engine.js (variação do motor JS que TRANSPILA um
// subconjunto restrito de C# pra JS antes de rodar contra os testes — ver
// esse arquivo pro porquê de não dar pra rodar C# de verdade no navegador).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const TEORIA_URL = '/turmas/jogos/atividades/csharp-teoria.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const COMPARACAO_URL = '/turmas/jogos/atividades/csharp-comparacao-pratica.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const DESAFIOS_URL = '/turmas/jogos/atividades/csharp-desafios-pratica.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';

const SOLUTIONS_COMPARACAO = [
  'int resultado = 100;',
  'int resultado = a + b;',
  'int resultado = a - b;',
  'int resultado = a * b;',
  'double resultado = a / b;',
];

const SOLUTIONS_DESAFIOS = [
  'int resultado = 100;',
  'string resultado = "Unity";',
  'int resultado = a + b;',
  'int resultado = a - b;',
  'int resultado = a * b;',
  'double resultado = a / b;',
  'int resultado = pontos + 10;',
  'Console.WriteLine(idade);',
  'Console.WriteLine("Olá, mundo!");',
  'Console.WriteLine(a + b);',
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

test.describe('turmas/jogos/atividades/csharp-teoria.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('mostra a 1ª etapa da história do C#, com a Bia como mentora', async ({ page }) => {
    await page.goto(TEORIA_URL);
    await expect(page.locator('.bia-name')).toHaveText('Bia, a Joaninha Debugger');
    // A ordem das 8 etapas é embaralhada a cada carregamento (ver
    // shared/quiz-teoria-engine.js, shuffleOrder) — não dá pra travar num
    // texto específico da 1ª história, só confirmar que é sobre C# mesmo.
    await expect(page.locator('.speech-bubble')).toContainText('C#');
    await expect(page.locator('#lblStepTotal')).toHaveText('8');
  });
});

test.describe('turmas/jogos/atividades/csharp-comparacao-pratica.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('mostra a comparação JS vs C# pros 5 conceitos, antes do widget de código', async ({ page }) => {
    await page.goto(COMPARACAO_URL);
    await expect(page.locator('.compare-card')).toContainText('Criar variável');
    await expect(page.locator('.compare-card')).toContainText('Criar constante');
    await expect(page.locator('.compare-card')).toContainText('Criar função');
    await expect(page.locator('.compare-card')).toContainText('If / else');
    await expect(page.locator('.compare-card')).toContainText('Laço de repetição');
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 1: Guardando um número');
  });

  test('resolve os 5 desafios (variável + 4 operações) em sequência e conclui o módulo', async ({ page }) => {
    await page.goto(COMPARACAO_URL);
    await solveAll(page, SOLUTIONS_COMPARACAO);
    await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
    await expect(page.locator('#lblProgress')).toHaveText('5/5');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`csharp_comparacao_progress_${u}`)), 'breno.silva80');
    expect(progress).toHaveLength(5);
  });

  test('declarar a divisão como int (em vez de double) falha — ensina o truncamento de int/int do C#', async ({ page }) => {
    await page.goto(COMPARACAO_URL);
    for (let i = 0; i < 4; i++) {
      await solveCurrent(page, SOLUTIONS_COMPARACAO[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 5: Dividindo duas variáveis');
    // a=7, b=2 esperado 3.5 — mas int trunca 7/2 pra 3, então deve falhar.
    await solveCurrent(page, 'int resultado = a / b;');
    await expect(page.locator('#consoleOutput')).toContainText('❌');
    await expect(page.locator('#consoleOutput')).toContainText('(esperado 3.5)');
    await expect(page.locator('#btnNext')).toBeHidden();
  });
});

test.describe('turmas/jogos/atividades/csharp-desafios-pratica.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('carrega travado a partir do 2º desafio, com o desafio 1 já certo', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 1: Guardando um número');
    await expect(page.locator('.challenge-item').nth(1)).toHaveClass(/locked/);
  });

  test('resolve os 10 desafios (variável + Console.WriteLine) em sequência e conclui o módulo', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    await solveAll(page, SOLUTIONS_DESAFIOS);
    await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
    await expect(page.locator('#lblProgress')).toHaveText('10/10');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`csharp_desafios_progress_${u}`)), 'breno.silva80');
    expect(progress).toHaveLength(10);
  });

  test('escrever JavaScript em vez de C# não passa — o motor exige sintaxe C# de verdade, não só "código que funciona"', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    // `let` não existe no C# reconhecido pelo motor — só int/double/float/string/bool/char/var.
    await solveCurrent(page, 'let resultado = 100;');
    await expect(page.locator('#consoleOutput')).toContainText('não reconheci o comando');
    await expect(page.locator('#btnNext')).toBeHidden();
  });

  test('desafio de Console.WriteLine não passa só atribuindo a variável, sem chamar Console.WriteLine', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    for (let i = 0; i < 7; i++) {
      await solveCurrent(page, SOLUTIONS_DESAFIOS[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 8: Mostrando uma variável no console');
    await solveCurrent(page, 'int resultado = idade;');
    await expect(page.locator('#consoleOutput')).toContainText('nada foi exibido');
    await expect(page.locator('#btnNext')).toBeHidden();
  });

  test('gabarito lista os 10 desafios com o critério certo pra cada tipo de checagem', async ({ page }) => {
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos');
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = page.locator('#gestaoGabaritoList > div', { hasText: 'Desafios de C#' });
    await expect(row).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('csharp-desafios-pratica-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('a = 2, b = 3 → resultado deve ser 5'); // variable (soma)
    expect(content).toContain('idade = 10 → Console.WriteLine deve mostrar [10]'); // console
  });
});

test.describe('turmas/jogos/plataforma.html — trilha C#', () => {
  test('aparece em Fundamentos de Programação, com os 3 módulos em ordem (teoria → comparação → desafios)', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Fundamentos de Programação")');
    await page.selectOption('#trilhaSelect', 'csharp');
    await expect(page.locator('#moduleSelector_csharp')).toContainText('Teoria — Introdução ao C#');
    await expect(page.locator('#moduleSelector_csharp')).toContainText('Prática — JavaScript vs C#');
    await expect(page.locator('#moduleSelector_csharp')).toContainText('Prática — Desafios de C#');
  });
});

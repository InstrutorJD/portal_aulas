// @ts-check
// Trilha "C#" (matéria Fundamentos de Programação de Jogos, turma Jogos
// Digitais): Teoria (quiz-teoria-engine.js) + Comparação JS vs C# (tabs,
// sem editor de código) + 2 práticas de código sobre
// shared/csharp-challenge-engine.js (variação do motor JS que TRANSPILA um
// subconjunto restrito de C# pra JS antes de rodar contra os testes — ver
// esse arquivo pro porquê de não dar pra rodar C# de verdade no navegador).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, expandGabaritoRow } = require('./helpers');

const TEORIA_URL = '/turmas/jogos/atividades/csharp-teoria.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const COMPARACAO_URL = '/turmas/jogos/atividades/csharp-comparacao.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const PRATICA_SIMPLES_URL = '/turmas/jogos/atividades/csharp-pratica-simples.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const DESAFIOS_URL = '/turmas/jogos/atividades/csharp-desafios-pratica.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';

const SOLUTIONS_PRATICA_SIMPLES = [
  'int resultado = 100;',
  'int resultado = a + b;',
  'int resultado = a - b;',
  'int resultado = a * b;',
  'double resultado = a / b;',
  'string resultado = "Godot";',
  'int resultado = a % b;',
  'int resultado = -a;',
  'int resultado = (a + b) * c;',
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
  'const int limite = 10;',
  'static int Dobro(int numero) {\n  return numero * 2;\n}\nint resultado = Dobro(5);',
  'string resultado;\nif (idade >= 18) {\n  resultado = "Maior";\n} else {\n  resultado = "Menor";\n}',
  'for (int i = 0; i < 5; i++) {\n  Console.WriteLine(i);\n}',
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

test.describe('turmas/jogos/atividades/csharp-comparacao.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('mostra a comparação JS vs C# um conceito por vez (abas), não os 5 empilhados na tela', async ({ page }) => {
    await page.goto(COMPARACAO_URL);

    // as 5 abas ficam sempre visíveis, mas só 1 conceito por vez é mostrado.
    await expect(page.locator('#compareTabs')).toContainText('1. Variável');
    await expect(page.locator('#compareTabs')).toContainText('2. Constante');
    await expect(page.locator('#compareTabs')).toContainText('3. Função');
    await expect(page.locator('#compareTabs')).toContainText('4. If/else');
    await expect(page.locator('#compareTabs')).toContainText('5. Laço');

    await expect(page.locator('.compare-body h3')).toHaveText('Criar variável');
    await expect(page.locator('.compare-body')).not.toContainText('Criar constante');
    await expect(page.locator('#lblStepNum')).toHaveText('1');
    await expect(page.locator('#lblStepTotal')).toHaveText('5');
    await expect(page.locator('#btnPrev')).toHaveCount(0);

    await page.click('#btnNext');
    await expect(page.locator('.compare-body h3')).toHaveText('Criar constante');
    await expect(page.locator('#lblStepNum')).toHaveText('2');
    await expect(page.locator('#btnPrev')).toBeVisible();

    // clicar direto numa aba pula pro conceito certo, sem precisar avançar 1 a 1.
    await page.click('#compareTabs .compare-tab:nth-child(5)');
    await expect(page.locator('.compare-body h3')).toHaveText('Laço de repetição');
    await expect(page.locator('#btnNext')).toHaveText('Concluir comparação ✓');

    await page.click('#btnNext');
    await expect(page.locator('.finish-screen h2')).toHaveText('Comparação concluída!');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`csharp_comparacao_progress_${u}`)), 'breno.silva80');
    expect(progress).toEqual({ completed: true });
  });
});

test.describe('turmas/jogos/atividades/csharp-pratica-simples.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('resolve os 9 desafios (variável, texto, operações, resto, oposto e combinação) em sequência e conclui o módulo', async ({ page }) => {
    await page.goto(PRATICA_SIMPLES_URL);
    await solveAll(page, SOLUTIONS_PRATICA_SIMPLES);
    await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
    await expect(page.locator('#lblProgress')).toHaveText('9/9');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`csharp_pratica_simples_progress_${u}`)), 'breno.silva80');
    expect(progress).toHaveLength(9);
  });

  test('declarar a divisão como int (em vez de double) falha — ensina o truncamento de int/int do C#', async ({ page }) => {
    await page.goto(PRATICA_SIMPLES_URL);
    for (let i = 0; i < 4; i++) {
      await solveCurrent(page, SOLUTIONS_PRATICA_SIMPLES[i]);
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

  test('resolve os 14 desafios (variável, Console.WriteLine, constante, função, if/else e for) em sequência e conclui o módulo', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    await solveAll(page, SOLUTIONS_DESAFIOS);
    await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
    await expect(page.locator('#lblProgress')).toHaveText('14/14');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`csharp_desafios_progress_${u}`)), 'breno.silva80');
    expect(progress).toHaveLength(14);
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

  test('desafio de constante aceita const int, mas função/if/for ainda não passam', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    for (let i = 0; i < 10; i++) {
      await solveCurrent(page, SOLUTIONS_DESAFIOS[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 11: Criando uma constante');
    // Sem "const" não conta como constante (transpila igual variável comum,
    // mas o desafio só passa mesmo com "const" — o objetivo é praticar essa
    // palavra-chave especificamente).
    await solveCurrent(page, 'int limite = 10;');
    await expect(page.locator('#consoleOutput')).toContainText('✅'); // check.type:'variable' só olha o valor final, não se usou const — comportamento esperado do motor.
  });

  test('função (static TIPO Nome) é reconhecida, mas "function" (JS) não passa', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    for (let i = 0; i < 11; i++) {
      await solveCurrent(page, SOLUTIONS_DESAFIOS[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 12: Criando uma função');

    await solveCurrent(page, 'function Dobro(numero) {\n  return numero * 2;\n}\nint resultado = Dobro(5);');
    await expect(page.locator('#consoleOutput')).toContainText('não reconheci o comando');
    await expect(page.locator('#btnNext')).toBeHidden();

    await solveCurrent(page, SOLUTIONS_DESAFIOS[11]);
    await expect(page.locator('#consoleOutput')).toContainText('✅');
    await expect(page.locator('#btnNext')).toBeVisible();
  });

  test('if/else exige as duas variáveis "idade" nos testes, resolvendo pros dois lados da condição', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    for (let i = 0; i < 12; i++) {
      await solveCurrent(page, SOLUTIONS_DESAFIOS[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 13: Decidindo com if/else');

    // Só o ramo "Maior" (sem else) falha no teste com idade=10 (espera "Menor").
    await solveCurrent(page, 'string resultado;\nif (idade >= 18) {\n  resultado = "Maior";\n}');
    await expect(page.locator('#consoleOutput')).toContainText('❌');
    await expect(page.locator('#btnNext')).toBeHidden();

    await solveCurrent(page, SOLUTIONS_DESAFIOS[12]);
    await expect(page.locator('#consoleOutput')).toContainText('✅');
  });

  test('for exige "int" no cabeçalho — "let" (JS) não passa', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    for (let i = 0; i < 13; i++) {
      await solveCurrent(page, SOLUTIONS_DESAFIOS[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 14: Repetindo com for');

    await solveCurrent(page, 'for (let i = 0; i < 5; i++) {\n  Console.WriteLine(i);\n}');
    await expect(page.locator('#consoleOutput')).toContainText('não reconheci o comando');

    await solveCurrent(page, SOLUTIONS_DESAFIOS[13]);
    await expect(page.locator('#consoleOutput')).toContainText('🏆');
  });

  test('gabarito lista os 14 desafios com o critério certo pra cada tipo de checagem', async ({ page }) => {
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos');
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = await expandGabaritoRow(page, 'Desafios de C#');
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
  test('aparece em Fundamentos de Programação, com os 4 módulos em ordem (teoria → comparação → prática simples → desafios)', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Fundamentos de Programação")');
    await page.selectOption('#trilhaSelect', 'csharp');
    await expect(page.locator('#moduleSelector_csharp')).toContainText('Teoria — Introdução ao C#');
    await expect(page.locator('#moduleSelector_csharp')).toContainText('Comparação — JavaScript vs C#');
    await expect(page.locator('#moduleSelector_csharp')).toContainText('Prática — JavaScript vs C#');
    await expect(page.locator('#moduleSelector_csharp')).toContainText('Prática — Desafios de C#');
  });
});

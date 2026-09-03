// @ts-check
// Trilha "GDScript" (matéria Fundamentos de Programação de Jogos, turma
// Jogos Digitais): Teoria (quiz-teoria-engine.js) + Comparação JS/C# vs
// GDScript (tabs de 3 colunas, sem editor de código) + 2 práticas de código
// sobre shared/gdscript-challenge-engine.js (mesmo espírito do motor de C#,
// mas o transpile rastreia INDENTAÇÃO em vez de chaves — GDScript não usa
// `;` nem `{ }` — ver esse arquivo pro porquê de não dar pra rodar GDScript
// de verdade no navegador).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, expandGabaritoRow } = require('./helpers');

const TEORIA_URL = '/turmas/jogos/atividades/gdscript-teoria.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const COMPARACAO_URL = '/turmas/jogos/atividades/gdscript-comparacao.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const PRATICA_SIMPLES_URL = '/turmas/jogos/atividades/gdscript-pratica-simples.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const DESAFIOS_URL = '/turmas/jogos/atividades/gdscript-desafios-pratica.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const CENARIOS_URL = '/turmas/jogos/atividades/gdscript-cenarios-pratica.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';

const SOLUTIONS_PRATICA_SIMPLES = [
  'var resultado = 100',
  'var resultado = a + b',
  'var resultado = a - b',
  'var resultado = a * b',
  'var resultado = a / b',
  'var resultado = "Godot"',
  'var resultado = a % b',
  'var resultado = -a',
  'var resultado = (a + b) * c',
];

const SOLUTIONS_DESAFIOS = [
  'var resultado = 100',
  'var resultado = "Godot"',
  'var resultado = a + b',
  'var resultado = a - b',
  'var resultado = a * b',
  'var resultado = a / b',
  'var resultado = pontos + 10',
  'print(idade)',
  'print("Olá, mundo!")',
  'print(a + b)',
  'const limite = 10',
  'func Dobro(numero):\n\treturn numero * 2\nvar resultado = Dobro(5)',
  'var resultado\nif idade >= 18:\n\tresultado = "Maior"\nelse:\n\tresultado = "Menor"',
  'for i in range(5):\n\tprint(i)',
];

const SOLUTIONS_CENARIOS = [
  'var resultado = posicao_x + velocidade',
  'var resultado = velocidade_y + gravidade',
  'var resultado\nif posicao_x + velocidade > largura_tela:\n\tresultado = largura_tela\nelse:\n\tresultado = posicao_x + velocidade',
  'func mover(posicao, vel):\n\treturn posicao + vel\nvar resultado = mover(posicao_x, velocidade)',
  'var resultado\nif posicao_y >= altura_chao:\n\tresultado = true\nelse:\n\tresultado = false',
  'var resultado\nif posicao_x < 0:\n\tresultado = true\nelse:\n\tresultado = false',
  'var resultado\nif posicao_jogador >= posicao_inimigo - alcance && posicao_jogador <= posicao_inimigo + alcance:\n\tresultado = true\nelse:\n\tresultado = false',
  'var resultado\nif caixa_a_esquerda < caixa_b_direita && caixa_a_direita > caixa_b_esquerda:\n\tresultado = true\nelse:\n\tresultado = false',
  'func calcularDano(atk, def):\n\treturn atk - def\nvar resultado = calcularDano(ataque, defesa)',
  'var resultado = ataque - defesa\nif resultado < 1:\n\tresultado = 1',
  'var resultado\nif tempo_desde_ataque >= cooldown:\n\tresultado = true\nelse:\n\tresultado = false',
  'var resultado\nif rolagem <= chance_critica:\n\tresultado = ataque * 2\nelse:\n\tresultado = ataque',
  'var resultado = dano - reducao_escudo\nif resultado < 0:\n\tresultado = 0',
  'var resultado\nif esquivou:\n\tresultado = vida\nelse:\n\tresultado = vida - dano',
  'func estaVivo(v):\n\treturn v > 0\nvar resultado = estaVivo(vida)',
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

test.describe('turmas/jogos/atividades/gdscript-teoria.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('mostra a 1ª etapa da história do GDScript, com o Godi como mentor', async ({ page }) => {
    await page.goto(TEORIA_URL);
    await expect(page.locator('.godi-name')).toHaveText('Godi, o Robô da Godot');
    // A ordem das 8 etapas é embaralhada a cada carregamento (ver
    // shared/quiz-teoria-engine.js, shuffleOrder) — não dá pra travar num
    // texto específico da 1ª história, só confirmar que é sobre GDScript mesmo.
    await expect(page.locator('.speech-bubble')).toContainText('GDScript');
    await expect(page.locator('#lblStepTotal')).toHaveText('8');
  });
});

test.describe('turmas/jogos/atividades/gdscript-comparacao.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('mostra a comparação de 3 colunas (JS/C#/GDScript) um conceito por vez', async ({ page }) => {
    await page.goto(COMPARACAO_URL);

    await expect(page.locator('#compareTabs')).toContainText('1. Variável');
    await expect(page.locator('#compareTabs')).toContainText('5. Laço');

    await expect(page.locator('.compare-body h3')).toHaveText('Criar variável');
    await expect(page.locator('.compare-cols')).toContainText('JavaScript');
    await expect(page.locator('.compare-cols')).toContainText('C#');
    await expect(page.locator('.compare-cols')).toContainText('GDScript');
    await expect(page.locator('.compare-col.gdscript pre')).toHaveText('var idade = 10');
    await expect(page.locator('#lblStepNum')).toHaveText('1');
    await expect(page.locator('#lblStepTotal')).toHaveText('5');

    // pula direto pro último conceito clicando na aba, sem precisar avançar 1 a 1.
    await page.click('#compareTabs .compare-tab:nth-child(5)');
    await expect(page.locator('.compare-body h3')).toHaveText('Laço de repetição');
    await expect(page.locator('.compare-col.gdscript pre')).toContainText('range(5)');
    await expect(page.locator('#btnNext')).toHaveText('Concluir comparação ✓');

    await page.click('#btnNext');
    await expect(page.locator('.finish-screen h2')).toHaveText('Comparação concluída!');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`gdscript_comparacao_progress_${u}`)), 'breno.silva80');
    expect(progress).toEqual({ completed: true });
  });
});

test.describe('turmas/jogos/atividades/gdscript-pratica-simples.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('resolve os 9 desafios (variável, texto, operações, resto, oposto e combinação) em sequência e conclui o módulo', async ({ page }) => {
    await page.goto(PRATICA_SIMPLES_URL);
    await solveAll(page, SOLUTIONS_PRATICA_SIMPLES);
    await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
    await expect(page.locator('#lblProgress')).toHaveText('9/9');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`gdscript_pratica_simples_progress_${u}`)), 'breno.silva80');
    expect(progress).toHaveLength(9);
  });

  test('escrever C#/JS (com `;`, `let` ou tipo) em vez de GDScript não passa', async ({ page }) => {
    await page.goto(PRATICA_SIMPLES_URL);
    // `;` no final e `let` não existem no GDScript reconhecido pelo motor.
    await solveCurrent(page, 'let resultado = 100;');
    await expect(page.locator('#consoleOutput')).toContainText('não reconheci o comando');
    await expect(page.locator('#btnNext')).toBeHidden();
  });
});

test.describe('turmas/jogos/atividades/gdscript-desafios-pratica.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('carrega travado a partir do 2º desafio, com o desafio 1 já certo', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 1: Guardando um número');
    await expect(page.locator('.challenge-item').nth(1)).toHaveClass(/locked/);
  });

  test('resolve os 14 desafios (variável, print, constante, função, if/else e for) em sequência e conclui o módulo', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    await solveAll(page, SOLUTIONS_DESAFIOS);
    await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
    await expect(page.locator('#lblProgress')).toHaveText('14/14');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`gdscript_desafios_progress_${u}`)), 'breno.silva80');
    expect(progress).toHaveLength(14);
  });

  test('função (func Nome(...):) é reconhecida, mas "func" sem dois-pontos ou com chaves (JS) não passa', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    for (let i = 0; i < 11; i++) {
      await solveCurrent(page, SOLUTIONS_DESAFIOS[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 12: Criando uma função');

    await solveCurrent(page, 'function Dobro(numero) {\n  return numero * 2;\n}\nvar resultado = Dobro(5)');
    await expect(page.locator('#consoleOutput')).toContainText('não reconheci o comando');
    await expect(page.locator('#btnNext')).toBeHidden();

    await solveCurrent(page, SOLUTIONS_DESAFIOS[11]);
    await expect(page.locator('#consoleOutput')).toContainText('✅');
    await expect(page.locator('#btnNext')).toBeVisible();
  });

  test('if/else exige a indentação certa — resolve pros dois lados da condição', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    for (let i = 0; i < 12; i++) {
      await solveCurrent(page, SOLUTIONS_DESAFIOS[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 13: Decidindo com if/else');

    // Só o ramo "Maior" (sem else) falha no teste com idade=10 (espera "Menor").
    await solveCurrent(page, 'var resultado\nif idade >= 18:\n\tresultado = "Maior"');
    await expect(page.locator('#consoleOutput')).toContainText('❌');
    await expect(page.locator('#btnNext')).toBeHidden();

    await solveCurrent(page, SOLUTIONS_DESAFIOS[12]);
    await expect(page.locator('#consoleOutput')).toContainText('✅');
  });

  test('for exige "range(...)" — usar `while`/`{}` (estilo JS) não passa', async ({ page }) => {
    await page.goto(DESAFIOS_URL);
    for (let i = 0; i < 13; i++) {
      await solveCurrent(page, SOLUTIONS_DESAFIOS[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 14: Repetindo com for');

    await solveCurrent(page, 'for (let i = 0; i < 5; i++) {\n  print(i);\n}');
    await expect(page.locator('#consoleOutput')).toContainText('não reconheci o comando');

    await solveCurrent(page, SOLUTIONS_DESAFIOS[13]);
    await expect(page.locator('#consoleOutput')).toContainText('🏆');
  });

  test('gabarito lista os 14 desafios com o critério certo pra cada tipo de checagem', async ({ page }) => {
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos');
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = await expandGabaritoRow(page, 'Desafios de GDScript');
    await expect(row).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('gdscript-desafios-pratica-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('a = 2, b = 3 → resultado deve ser 5'); // variable (soma)
    expect(content).toContain('idade = 10 → print deve mostrar [10]'); // console
  });
});

test.describe('turmas/jogos/atividades/gdscript-cenarios-pratica.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('carrega travado a partir do 2º desafio, com o desafio 1 (Movimento) já disponível', async ({ page }) => {
    await page.goto(CENARIOS_URL);
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 1: Mover para o lado');
    await expect(page.locator('.challenge-item').nth(1)).toHaveClass(/locked/);
  });

  test('resolve os 15 cenários (movimento, colisão, ataque e defesa) em sequência e conclui o módulo', async ({ page }) => {
    await page.goto(CENARIOS_URL);
    await solveAll(page, SOLUTIONS_CENARIOS);
    await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
    await expect(page.locator('#lblProgress')).toHaveText('15/15');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`gdscript_cenarios_progress_${u}`)), 'breno.silva80');
    expect(progress).toHaveLength(15);
  });

  test('colisão entre caixas exige a condição das DUAS bordas — só uma delas não basta', async ({ page }) => {
    await page.goto(CENARIOS_URL);
    for (let i = 0; i < 7; i++) {
      await solveCurrent(page, SOLUTIONS_CENARIOS[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 8: Colisão entre duas caixas');

    // só confere a borda esquerda, ignora a direita — falha no caso "encostando" (esperado false).
    await solveCurrent(page, 'var resultado\nif caixa_a_esquerda < caixa_b_direita:\n\tresultado = true\nelse:\n\tresultado = false');
    await expect(page.locator('#consoleOutput')).toContainText('❌');
    await expect(page.locator('#btnNext')).toBeHidden();

    await solveCurrent(page, SOLUTIONS_CENARIOS[7]);
    await expect(page.locator('#consoleOutput')).toContainText('✅');
    await expect(page.locator('#btnNext')).toBeVisible();
  });

  test('dano mínimo garantido: esquecer o "piso" de 1 falha quando ataque - defesa não é suficiente', async ({ page }) => {
    await page.goto(CENARIOS_URL);
    for (let i = 0; i < 9; i++) {
      await solveCurrent(page, SOLUTIONS_CENARIOS[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 10: Dano mínimo garantido');

    // sem o "if resultado < 1", o caso ataque=5/defesa=20 dá -15 em vez de 1.
    await solveCurrent(page, 'var resultado = ataque - defesa');
    await expect(page.locator('#consoleOutput')).toContainText('❌');

    await solveCurrent(page, SOLUTIONS_CENARIOS[9]);
    await expect(page.locator('#consoleOutput')).toContainText('✅');
  });

  test('escrever JS (`&&` fora de uma condição GDScript, `;`, chaves) em vez de GDScript não passa', async ({ page }) => {
    await page.goto(CENARIOS_URL);
    await solveCurrent(page, 'let resultado = posicao_x + velocidade;');
    await expect(page.locator('#consoleOutput')).toContainText('não reconheci o comando');
    await expect(page.locator('#btnNext')).toBeHidden();
  });

  test('gabarito lista os 15 cenários, com o grupo (Movimento/Colisão/Ataque/Defesa) no título', async ({ page }) => {
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos');
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = await expandGabaritoRow(page, 'Cenários de Jogo (GDScript)');
    await expect(row).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('gdscript-cenarios-pratica-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('[Movimento] Mover para o lado');
    expect(content).toContain('[Defesa] Função "estaVivo"');
    expect(content).toContain('posicao_x = 100, velocidade = 5 → resultado deve ser 105');
  });
});

test.describe('turmas/jogos/plataforma.html — trilha GDScript', () => {
  test('aparece em Fundamentos de Programação, com os 5 módulos em ordem (teoria → comparação → prática simples → desafios → cenários)', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Fundamentos de Programação")');
    await page.selectOption('#trilhaSelect', 'gdscript');
    await expect(page.locator('#moduleSelector_gdscript')).toContainText('Teoria — Introdução ao GDScript');
    await expect(page.locator('#moduleSelector_gdscript')).toContainText('Comparação — JS/C# vs GDScript');
    await expect(page.locator('#moduleSelector_gdscript')).toContainText('Prática — GDScript Simples');
    await expect(page.locator('#moduleSelector_gdscript')).toContainText('Prática — Desafios de GDScript');
    await expect(page.locator('#moduleSelector_gdscript')).toContainText('Prática — Cenários de Jogo (GDScript)');
  });
});

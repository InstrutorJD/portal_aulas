// @ts-check
// Trilha "Motor Godot" (matéria Codificação de Jogos, turma Jogos Digitais):
// Teoria (quiz-teoria-engine.js, mentor Bia) + Prática de código sobre
// shared/gdscript-challenge-engine.js (mesmo motor usado pela trilha
// GDScript, em Fundamentos de Programação) — implementa, passo a passo, o
// pipeline de movimentação top-down do Guia Definitivo Godot 4.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, expandGabaritoRow } = require('./helpers');

const TEORIA_URL = '/turmas/jogos/atividades/cod-godot-teoria.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const PRATICA_URL = '/turmas/jogos/atividades/cod-godot-pratica.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';

const SOLUTIONS_PRATICA = [
  'func direcaoX(direita, esquerda):\n\tif direita && !esquerda:\n\t\treturn 1\n\telse:\n\t\tif esquerda && !direita:\n\t\t\treturn -1\n\t\telse:\n\t\t\treturn 0\nvar resultado = direcaoX(pressionando_direita, pressionando_esquerda)',
  'func direcaoY(baixo, cima):\n\tif baixo && !cima:\n\t\treturn 1\n\telse:\n\t\tif cima && !baixo:\n\t\t\treturn -1\n\t\telse:\n\t\t\treturn 0\nvar resultado = direcaoY(pressionando_baixo, pressionando_cima)',
  'var resultado\nif direcao_x != 0 && direcao_y != 0:\n\tresultado = true\nelse:\n\tresultado = false',
  'var resultado = direcao_x / magnitude',
  'var resultado = direcao_y / magnitude',
  'var resultado = direcao_x_normalizada * velocidade_jogador',
  'var resultado = direcao_y_normalizada * velocidade_jogador',
  'var resultado = velocidade_x * delta',
  'var resultado = posicao_x + deslocamento_x',
  'func moverEixo(direcao, velocidade, posicao, delta):\n\treturn posicao + direcao * velocidade * delta\nvar resultado = moverEixo(direcao_normalizada, velocidade_jogador, posicao_x, delta)',
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

test.describe('turmas/jogos/atividades/cod-godot-teoria.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('mostra a 1ª etapa da teoria, com a Bia como mentora', async ({ page }) => {
    await page.goto(TEORIA_URL);
    await expect(page.locator('.bia-name')).toHaveText('Bia, a Joaninha Debugger');
    // A ordem das 9 etapas é embaralhada a cada carregamento (ver
    // shared/quiz-teoria-engine.js, shuffleOrder) — só confirma o total.
    await expect(page.locator('#lblStepTotal')).toHaveText('9');
  });
});

test.describe('turmas/jogos/atividades/cod-godot-pratica.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('carrega travado a partir do 2º desafio, com o desafio 1 (Direção X) já disponível', async ({ page }) => {
    await page.goto(PRATICA_URL);
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 1: Direção X a partir do input');
    await expect(page.locator('.challenge-item').nth(1)).toHaveClass(/locked/);
  });

  test('resolve os 10 desafios (direção, diagonal, normalização, velocidade e delta) em sequência e conclui o módulo', async ({ page }) => {
    await page.goto(PRATICA_URL);
    await solveAll(page, SOLUTIONS_PRATICA);
    await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
    await expect(page.locator('#lblProgress')).toHaveText('10/10');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`cod_godot_pratica_progress_${u}`)), 'breno.silva80');
    expect(progress).toHaveLength(10);
  });

  test('escrever JS (`;`, chaves) em vez de GDScript não passa', async ({ page }) => {
    await page.goto(PRATICA_URL);
    await solveCurrent(page, 'let resultado = velocidade_x * delta;');
    await expect(page.locator('#consoleOutput')).toContainText('não reconheci o comando');
    await expect(page.locator('#btnNext')).toBeHidden();
  });

  test('normalização exige dividir pela magnitude — usar a direção crua sem dividir falha', async ({ page }) => {
    await page.goto(PRATICA_URL);
    for (let i = 0; i < 3; i++) {
      await solveCurrent(page, SOLUTIONS_PRATICA[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 4: Normalizando o eixo X');

    await solveCurrent(page, 'var resultado = direcao_x');
    await expect(page.locator('#consoleOutput')).toContainText('❌');
    await expect(page.locator('#btnNext')).toBeHidden();

    await solveCurrent(page, SOLUTIONS_PRATICA[3]);
    await expect(page.locator('#consoleOutput')).toContainText('✅');
  });

  test('gabarito lista os 10 desafios com o critério certo pra cada um', async ({ page }) => {
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos');
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = await expandGabaritoRow(page, 'Central de Codificação: Motor Godot');
    await expect(row).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('cod-godot-pratica-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('resultado deve ser 150'); // desafio 10 (capstone), 1º teste
  });
});

test.describe('turmas/jogos/plataforma.html — trilha Motor Godot', () => {
  test('aparece em Codificação de Jogos, com a prática travada até a teoria ser concluída', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Codificação de Jogos")');
    await page.selectOption('#trilhaSelect', 'cod-godot');
    await expect(page.locator('#moduleSelector_cod-godot')).toContainText('Teoria — Motor Godot');

    const praticaCard = page.locator('#moduleSelector_cod-godot .game-card', { hasText: 'Prática' });
    await expect(praticaCard).toHaveClass(/locked/);
    await expect(praticaCard).toContainText('Bloqueado');
  });
});

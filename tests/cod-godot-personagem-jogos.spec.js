// @ts-check
// 3 últimos módulos ("Personagem Jogável") da trilha unificada "Motor
// Godot" (matéria Codificação de Jogos, turma Jogos Digitais) — ver
// tests/cod-godot-jogos.spec.js pros 2 primeiros. Teoria
// (quiz-teoria-engine.js, mentor Bia) + Prática de código sobre
// shared/gdscript-challenge-engine.js — implementa, em GDScript de
// verdade, a lógica por trás das boas práticas da Proposta de Arquitetura
// Técnica (pivô, colisor, Z-Index, nomes/pastas de cena).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, expandGabaritoRow } = require('./helpers');

const TEORIA_URL = '/turmas/jogos/atividades/cod-godot-personagem-teoria.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const PRATICA_URL = '/turmas/jogos/atividades/cod-godot-personagem-pratica.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const ROTEIRO_URL = '/turmas/jogos/atividades/cod-godot-personagem-roteiro.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';

const TOKEN_VALIDO = '482913';
const SEED_ROTEIRO = {
  profiles: [
    { id: 'fake-breno.silva80', email: 'breno.silva80', nome: 'Breno Silva', role: 'aluno', turma: 'jogos' },
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
  professor_tokens: [
    { token: TOKEN_VALIDO, created_by: 'fake-admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  ],
};

async function darVisto(page, token) {
  await page.fill('#vistoToken', token);
  await page.click('#btnDarVisto');
}

const SOLUTIONS_PRATICA = [
  'var resultado\nif offset_x == 0 && offset_y == 0:\n\tresultado = true\nelse:\n\tresultado = false',
  'var resultado = largura_sprite / 2',
  'var resultado = altura_sprite / 2',
  'var resultado\nif altura_elemento >= altura_base_personagem:\n\tresultado = true\nelse:\n\tresultado = false',
  'func zIndexPersonagem(z_cenario):\n\treturn z_cenario + 1\nvar resultado = zIndexPersonagem(z_cenario)',
  'var resultado\nif z_personagem > z_cenario:\n\tresultado = true\nelse:\n\tresultado = false',
  'var resultado = nome_base + ".tscn"',
  'var resultado = nome_base + ".gd"',
  'var resultado\nif controlado_via_script:\n\tresultado = "CharacterBody2D"\nelse:\n\tresultado = "RigidBody2D"',
  'func caminhoCena(pasta, nome):\n\treturn pasta + nome + ".tscn"\nvar resultado = caminhoCena(pasta_scenes, nome_base)',
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

test.describe('turmas/jogos/atividades/cod-godot-personagem-teoria.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('mostra a 1ª etapa da teoria, com a Bia como mentora', async ({ page }) => {
    await page.goto(TEORIA_URL);
    await expect(page.locator('.bia-name')).toHaveText('Bia, a Joaninha Debugger');
    await expect(page.locator('#lblStepTotal')).toHaveText('6');
  });
});

test.describe('turmas/jogos/atividades/cod-godot-personagem-pratica.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('carrega travado a partir do 2º desafio, com o desafio 1 (Pivô) já disponível', async ({ page }) => {
    await page.goto(PRATICA_URL);
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 1: Pivô centralizado?');
    await expect(page.locator('.challenge-item').nth(1)).toHaveClass(/locked/);
  });

  test('resolve os 10 desafios (pivô, colisor, Z-Index e convenção de nomes) em sequência e conclui o módulo', async ({ page }) => {
    await page.goto(PRATICA_URL);
    await solveAll(page, SOLUTIONS_PRATICA);
    await expect(page.locator('#consoleOutput')).toContainText('Você concluiu todos os desafios');
    await expect(page.locator('#lblProgress')).toHaveText('10/10');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`cod_godot_personagem_pratica_progress_${u}`)), 'breno.silva80');
    expect(progress).toHaveLength(10);
  });

  test('nome do arquivo exige a extensão certa — esquecer ".tscn" falha', async ({ page }) => {
    await page.goto(PRATICA_URL);
    for (let i = 0; i < 6; i++) {
      await solveCurrent(page, SOLUTIONS_PRATICA[i]);
      await page.click('#btnNext');
    }
    await expect(page.locator('#challengeTitle')).toHaveText('Desafio 7: Nome do arquivo da cena (snake_case)');

    await solveCurrent(page, 'var resultado = nome_base');
    await expect(page.locator('#consoleOutput')).toContainText('❌');
    await expect(page.locator('#btnNext')).toBeHidden();

    await solveCurrent(page, SOLUTIONS_PRATICA[6]);
    await expect(page.locator('#consoleOutput')).toContainText('✅');
  });

  test('gabarito lista os 10 desafios com o critério certo pra cada um', async ({ page }) => {
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos');
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = await expandGabaritoRow(page, 'Central de Codificação: Personagem Jogável');
    await expect(row).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('cod-godot-personagem-pratica-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('resultado deve ser "res://scenes/jogador/jogador.tscn"'); // desafio 10 (capstone), 1º teste
  });
});

test.describe('turmas/jogos/atividades/cod-godot-personagem-roteiro.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED_ROTEIRO);
  });

  test('navega pelas telas com Voltar/Próximo, mostrando o script de movimentação verificado', async ({ page }) => {
    await page.goto(ROTEIRO_URL);
    await expect(page.locator('.card h2')).toHaveText('Apresentação');

    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < 5; i++) await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('5. Escrever o script de movimentação');
    await expect(page.locator('.md-body pre code')).toContainText('_physics_process(delta)');
    await expect(page.locator('.md-body pre code')).toContainText('move_and_slide()');
    await expect(page.locator('.md-body pre code')).not.toContainText('func _process(delta):');

    await page.reload();
    await expect(page.locator('.card h2')).toHaveText('5. Escrever o script de movimentação');

    await page.click('#btnBack');
    await expect(page.locator('.card h2')).toHaveText('4. Configurar o Input Map');
    expect(total).toBe(8);
  });

  test('depois da última tela, chega na tela de visto do professor', async ({ page }) => {
    await page.goto(ROTEIRO_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');
    await expect(page.locator('.visto-box h2')).toContainText('Visto do professor');
    await expect(page.locator('#btnDarVisto')).toBeVisible();
  });

  test('token errado mostra erro e não conclui a atividade', async ({ page }) => {
    await page.goto(ROTEIRO_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, '000000');
    await expect(page.locator('#vistoMsg')).toContainText('inválido ou expirado');

    const progress = await page.evaluate(u => localStorage.getItem(`cod_godot_personagem_roteiro_progress_${u}`), 'breno.silva80');
    expect(progress).toBeNull();
  });

  test('visto do professor conclui a atividade', async ({ page }) => {
    await page.goto(ROTEIRO_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, TOKEN_VALIDO);
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
    await expect(page.locator('.visto-box')).toContainText('Instrutor / Professor');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`cod_godot_personagem_roteiro_progress_${u}`)), 'breno.silva80');
    expect(progress).toMatchObject({ completed: true, vistoPor: 'Instrutor / Professor' });

    await page.reload();
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
  });
});

// O check de navegação pela plataforma (trilhaSelect, cadeado por módulo)
// mudou pra um único bloco cobrindo os 5 módulos em sequência — ver
// tests/cod-godot-jogos.spec.js, describe "trilha Motor Godot (unificada)".
// As trilhas "Motor Godot" e "Motor Godot: Personagem Jogável" foram
// fundidas numa só (turmas/jogos/config.js) por terem nome/capacidade
// redundantes — o conteúdo de cada módulo (testado acima, direto pela URL
// da atividade) continua o mesmo.

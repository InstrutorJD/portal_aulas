// @ts-check
// Trilha "Motor Godot: Construa o Pacman" (matéria Codificação de Jogos,
// turma Jogos Digitais) — reformulada em cima do roteiro
// pacman-godot-completo.md (raiz do repo): 2 módulos só.
//
// 1) Prática (roteiro, sem correção automática — o "produto" é um projeto
//    Godot 4 aberto no computador do aluno, fora do portal): navega por
//    Voltar/Próximo pelos 17 passos (5 scripts completos, Autoload, montagem
//    da cena) até o visto do professor, sem nenhuma trava — mesmo padrão de
//    cod-godot-personagem-roteiro.html (trilha anterior).
// 2) Teoria (quiz-teoria-engine.js, mentor Bia): revisa as decisões técnicas
//    do próprio código do roteiro (Autoload, _draw()/queue_redraw(),
//    movimento em grade, ordem de _ready(), delta clamp, máquina de estado
//    do fantasma) — só desbloqueia depois do visto na prática (requires).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, gerarGabaritoFlutuante } = require('./helpers');

const PRATICA_URL = '/turmas/jogos/atividades/cod-godot-pratica.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';
const TEORIA_URL = '/turmas/jogos/atividades/cod-godot-teoria.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';

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

test.describe('turmas/jogos/atividades/cod-godot-pratica.html (roteiro Pacman)', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED_ROTEIRO);
  });

  test('mostra a "Apresentação" primeiro, com as 17 etapas + visto no total', async ({ page }) => {
    await page.goto(PRATICA_URL);
    await expect(page.locator('.card h2')).toHaveText('Apresentação');
    const total = await page.evaluate(() => STEPS.length);
    expect(total).toBe(17);
    await expect(page.locator('#lblStepTotal')).toHaveText('18');
  });

  test('navega pelas telas com Voltar/Próximo, mostrando o código de pacman.gd', async ({ page }) => {
    await page.goto(PRATICA_URL);
    for (let i = 0; i < 4; i++) await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('4. Script: pacman.gd — o jogador');
    await expect(page.locator('.md-body pre code')).toContainText('extends Node2D');
    await expect(page.locator('.md-body pre code')).toContainText('delta = min(delta, 0.05)');
    await expect(page.locator('.md-body pre code')).toContainText('func initialize():');

    await page.reload();
    await expect(page.locator('.card h2')).toHaveText('4. Script: pacman.gd — o jogador');

    await page.click('#btnBack');
    await expect(page.locator('.card h2')).toHaveText('3. Script: maze.gd — o labirinto');
    await expect(page.locator('.md-body pre code')).toContainText('func try_eat(cell: Vector2i) -> int:');
  });

  test('etapa do Autoload explica o nome exato "GameManager"', async ({ page }) => {
    await page.goto(PRATICA_URL);
    for (let i = 0; i < 8; i++) await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('8. Transformando o game_manager.gd numa variável global (Autoload)');
    await expect(page.locator('.md-body')).toContainText('GameManager');
  });

  test('depois da última tela, chega na tela de visto do professor', async ({ page }) => {
    await page.goto(PRATICA_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');
    await expect(page.locator('.visto-box h2')).toContainText('Visto do professor');
    await expect(page.locator('#btnDarVisto')).toBeVisible();
  });

  test('token errado mostra erro e não conclui a atividade', async ({ page }) => {
    await page.goto(PRATICA_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, '000000');
    await expect(page.locator('#vistoMsg')).toContainText('inválido ou expirado');

    const progress = await page.evaluate(u => localStorage.getItem(`cod_godot_pratica_progress_${u}`), 'breno.silva80');
    expect(progress).toBeNull();
  });

  test('visto do professor conclui a atividade', async ({ page }) => {
    await page.goto(PRATICA_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await darVisto(page, TOKEN_VALIDO);
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
    await expect(page.locator('.visto-box')).toContainText('Instrutor / Professor');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`cod_godot_pratica_progress_${u}`)), 'breno.silva80');
    expect(progress).toMatchObject({ completed: true, vistoPor: 'Instrutor / Professor' });

    await page.reload();
    await expect(page.locator('.visto-box h2')).toContainText('Atividade concluída');
  });

  test('gabarito lista o checklist técnico pro professor conferir o projeto', async ({ page }) => {
    await page.goto('/turmas/jogos/atividades/cod-godot-pratica.html?user=admin&role=professor&turma=jogos');

    const download = await gerarGabaritoFlutuante(page);
    expect(download.suggestedFilename()).toBe('cod-godot-pratica-checklist.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('GameManager');
  });
});

test.describe('turmas/jogos/atividades/cod-godot-teoria.html (quiz Pacman)', () => {
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

  test('gabarito lista as 9 perguntas com a resposta certa pra cada uma', async ({ page }) => {
    await page.goto('/turmas/jogos/atividades/cod-godot-teoria.html?user=admin&role=professor&turma=jogos');

    const download = await gerarGabaritoFlutuante(page);
    expect(download.suggestedFilename()).toBe('cod-godot-teoria-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('Autoload');
  });
});

test.describe('turmas/jogos/plataforma.html — trilha Motor Godot: Construa o Pacman', () => {
  test('aparece em Codificação de Jogos com 2 módulos: prática destravada, teoria travada até o visto', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Codificação de Jogos")');
    await page.selectOption('#trilhaSelect', 'cod-godot');
    const selector = page.locator('#moduleSelector_cod-godot');
    await expect(selector).toContainText('Prática — Construa o Pacman no Godot');
    await expect(selector).toContainText('Teoria — Motor Godot: o Pacman por trás do código');

    const praticaCard = selector.locator('.game-card', { hasText: 'Prática — Construa o Pacman no Godot' });
    await expect(praticaCard).not.toHaveClass(/locked/);

    const teoriaCard = selector.locator('.game-card', { hasText: 'Teoria — Motor Godot: o Pacman por trás do código' });
    await expect(teoriaCard).toHaveClass(/locked/);
    await expect(teoriaCard).toContainText('Bloqueado');
  });

  test('teoria destrava assim que a prática recebe o visto do professor', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(user => {
      localStorage.setItem(`cod_godot_pratica_progress_${user}`, JSON.stringify({ completed: true, vistoPor: 'Instrutor / Professor', vistoEm: new Date().toISOString() }));
    }, 'breno.silva80');
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Codificação de Jogos")');
    await page.selectOption('#trilhaSelect', 'cod-godot');
    const selector = page.locator('#moduleSelector_cod-godot');

    const teoriaCard = selector.locator('.game-card', { hasText: 'Teoria — Motor Godot: o Pacman por trás do código' });
    await expect(teoriaCard).not.toHaveClass(/locked/);
  });
});

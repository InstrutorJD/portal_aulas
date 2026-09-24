// @ts-check
// Matéria "Recuperação" (shared/recuperacao-config.js): card que só
// aparece pro aluno com 1+ matéria abaixo de 6,0 no bimestre atual (depois
// que o professor liga "Mostrar Notas"), com a trilha teórica "Programação
// do Zero" e o jogo "O Herói do Código" — onde cada item/poder do herói é
// construído pelo aluno em código num terminal.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const ALUNO_URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos';
const PROFESSOR_URL = '/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos';
const JOGO_URL = '/turmas/recuperacao/atividades/recuperacao-jogo.html?user=breno.silva80&role=aluno&turma=jogos';
const TEORIA_URL = '/turmas/recuperacao/atividades/recuperacao-teoria.html?user=breno.silva80&role=aluno&turma=jogos';

const TRILHAS_BIMESTRE_1 = [
  { turma: 'jogos', trilha_key: 'vida-autoconhecimento', bimestre: 1 },
  { turma: 'jogos', trilha_key: 'prova-diagnostica', bimestre: 1 },
  { turma: 'jogos', trilha_key: 'prova-final', bimestre: 1 },
];

// Mesmo cenário de tests/perfil-aluno.spec.js: Projeto de Vida com nota
// 2,00 (trilha 0% + Prova 3,0 + Prova Final 3,0) — abaixo de 6,0.
function seedEmRecuperacao(notasLiberadas) {
  return {
    bimestre_dates: [{ turma: 'jogos', bimestre: 1, inicio: '2000-01-01', fim: '2999-12-31', notas_liberadas: notasLiberadas }],
    trilha_bimestre: TRILHAS_BIMESTRE_1,
    student_module_progress: [],
    student_activity_state: [
      { student_email: 'breno.silva80', progress_key: 'prova_jogos', state: { completed: true, correctCount: 6, total: 20, nota: 30 } },
      { student_email: 'breno.silva80', progress_key: 'prova_final_jogos', state: { completed: true, correctCount: 6, total: 20, nota: 30 } },
    ],
    grades: [],
  };
}

test.describe('Card "Recuperação" na aba Aulas', () => {
  test('aluno com matéria abaixo de 6,0 vê o card, com as 2 trilhas dentro', async ({ page }) => {
    await stubSupabaseFake(page, seedEmRecuperacao(true));
    await page.goto(ALUNO_URL);

    const card = page.locator('#materiaCardRecuperacao');
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.locator('#materiaDetailTitle')).toHaveText('Recuperação');
    const select = page.locator('#trilhaSelect');
    await expect(select).toContainText('Programação do Zero');
    await expect(select).toContainText('O Herói do Código');
  });

  test('com "Mostrar Notas" desligado o card não aparece, mesmo com nota baixa', async ({ page }) => {
    await stubSupabaseFake(page, seedEmRecuperacao(false));
    await page.goto(ALUNO_URL);
    await expect(page.locator('#materiaCardGrid .game-card').first()).toBeVisible();
    await page.waitForTimeout(300);
    await expect(page.locator('#materiaCardRecuperacao')).toHaveCount(0);
  });

  test('aluno aprovado em todas as matérias não vê o card', async ({ page }) => {
    await stubSupabaseFake(page, {
      bimestre_dates: [{ turma: 'jogos', bimestre: 1, inicio: '2000-01-01', fim: '2999-12-31', notas_liberadas: true }],
      trilha_bimestre: TRILHAS_BIMESTRE_1,
      student_module_progress: [
        { student_email: 'breno.silva80', turma: 'jogos', trilha_key: 'vida-autoconhecimento', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true },
        { student_email: 'breno.silva80', turma: 'jogos', trilha_key: 'vida-autoconhecimento', module_key: 'pratica', progress_current: 3, progress_total: 5 },
      ],
      student_activity_state: [
        { student_email: 'breno.silva80', progress_key: 'prova_jogos', state: { completed: true, correctCount: 16, total: 20, nota: 80 } },
        { student_email: 'breno.silva80', progress_key: 'prova_final_jogos', state: { completed: true, correctCount: 15, total: 25, nota: 60 } },
      ],
      grades: [],
    });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#materiaCardGrid .game-card').first()).toBeVisible();
    await page.waitForTimeout(300);
    await expect(page.locator('#materiaCardRecuperacao')).toHaveCount(0);
  });

  test('professor sempre vê o card, pra revisar o conteúdo', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(PROFESSOR_URL);
    await expect(page.locator('#materiaCardRecuperacao')).toBeVisible();
    await expect(page.locator('#materiaCardRecuperacao')).toContainText('Só pra quem está em recuperação');
  });
});

test.describe('Trilha "Programação do Zero" (teoria)', () => {
  test('abre com a mentora e as 16 etapas', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(TEORIA_URL);
    await expect(page.locator('#storyWrap')).toContainText('Bia');
    await expect(page.locator('#lblStepTotal')).toHaveText('16');
  });
});

async function openTerminalFor(page, id) {
  await page.evaluate((stageId) => window.__heroiDoCodigo.openTerminal(window.__heroiDoCodigo.stageIndex(stageId)), id);
}

async function runCode(page, code) {
  await page.fill('#codeInput', code);
  await page.click('#btnRun');
}

test.describe('Jogo "O Herói do Código"', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('andando até o 1º altar abre o terminal; let espada = true; dá a espada ao herói e salva o progresso', async ({ page }) => {
    await page.goto(JOGO_URL);
    await page.locator('#gameCanvas').click();
    await page.keyboard.down('ArrowRight');
    await expect(page.locator('#terminal')).toHaveClass(/open/, { timeout: 5000 });
    await page.keyboard.up('ArrowRight');
    await expect(page.locator('#missionTitle')).toContainText('Espada');

    // Erro comum: true entre aspas vira texto.
    await page.fill('#codeInput', 'let espada = "true";');
    await page.click('#btnRun');
    await expect(page.locator('#consoleOutput')).toContainText('entre aspas vira TEXTO');

    await page.fill('#codeInput', 'let espada = true;');
    await page.click('#btnRun');
    await expect(page.locator('#consoleOutput')).toContainText('Código aceito');
    expect(await page.evaluate(() => window.__heroiDoCodigo.abilities.espada)).toBe(true);

    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('recuperacao_jogo_progress_breno.silva80')));
    expect(progress).toEqual(['espada']);
    await expect(page.locator('#terminal')).not.toHaveClass(/open/, { timeout: 4000 });
  });

  test('o if do baú precisa decidir de verdade: abrir o baú fora do if é recusado', async ({ page }) => {
    await page.goto(JOGO_URL);
    await openTerminalFor(page, 'botas');
    await expect(page.locator('#missionTitle')).toContainText('Baú');

    await page.fill('#codeInput', 'let chave = true;\nlet bauAberto = false;\nif (chave) { }\nbauAberto = true;');
    await page.click('#btnRun');
    await expect(page.locator('#consoleOutput')).toContainText('abriu até SEM a chave');

    await page.fill('#codeInput', 'let chave = true;\nlet bauAberto = false;\nif (chave) {\n  bauAberto = true;\n}');
    await page.click('#btnRun');
    await expect(page.locator('#consoleOutput')).toContainText('Código aceito');
    expect(await page.evaluate(() => window.__heroiDoCodigo.abilities.botas)).toBe(true);
  });

  test('funções: defender(dano) precisa devolver a metade, e o jogo passa a usar a função do aluno', async ({ page }) => {
    await page.goto(JOGO_URL);
    await openTerminalFor(page, 'defender');

    await page.fill('#codeInput', 'function defender(dano) {\n  return dano - 1;\n}');
    await page.click('#btnRun');
    await expect(page.locator('#consoleOutput')).toContainText('defender(10) devolveu 9');

    await page.fill('#codeInput', 'function defender(dano) {\n  return dano / 2;\n}');
    await page.click('#btnRun');
    await expect(page.locator('#consoleOutput')).toContainText('Código aceito');
    expect(await page.evaluate(() => window.__heroiDoCodigo.abilities.defender(8))).toBe(4);
  });

  test('são 14 etapas em 4 capítulos, na ordem variáveis → decisões → funções → criando o mundo', async ({ page }) => {
    await page.goto(JOGO_URL);
    await expect(page.locator('#lblStepTotal')).toHaveText('14');
    const ids = await page.evaluate(() => window.__heroiDoCodigo.stages.map(s => `${s.cap}:${s.id}`));
    expect(ids).toEqual([
      '1:espada', '1:vida', '1:nome', '1:forca',
      '2:botas', '2:tocha',
      '3:portal', '3:atacar', '3:defender', '3:bloquear', '3:tirarVida',
      '4:criarInimigo', '4:onda',
      '5:chefao',
    ]);
    await openTerminalFor(page, 'tirarVida');
    await expect(page.locator('#missionStep')).toContainText('Capítulo 3 — Funções · Etapa 11 de 14');
  });

  test('if / else da tocha: o else precisa funcionar quando escuro é false', async ({ page }) => {
    await page.goto(JOGO_URL);
    await openTerminalFor(page, 'tocha');
    await runCode(page, 'let escuro = true;\nlet tocha = "";\nif (escuro) {\n  tocha = "acesa";\n} else {\n  tocha = "acesa";\n}');
    await expect(page.locator('#consoleOutput')).toContainText('devia ficar "apagada"');

    await runCode(page, 'let escuro = true;\nlet tocha = "";\nif (escuro) {\n  tocha = "acesa";\n} else {\n  tocha = "apagada";\n}');
    await expect(page.locator('#consoleOutput')).toContainText('Código aceito');
    expect(await page.evaluate(() => window.__heroiDoCodigo.abilities.tocha)).toBe(true);
  });

  test('chamar função: sem parênteses não roda; abrirPortal(); abre o portal', async ({ page }) => {
    await page.goto(JOGO_URL);
    await openTerminalFor(page, 'portal');
    await runCode(page, 'abrirPortal;');
    await expect(page.locator('#consoleOutput')).toContainText('Faltaram os parênteses');

    await runCode(page, 'abrirPortal();');
    await expect(page.locator('#consoleOutput')).toContainText('Código aceito');
    expect(await page.evaluate(() => window.__heroiDoCodigo.abilities.portal)).toBe(true);
  });

  test('tirarVida(vidaInimigo, dano) exige if / else e nunca deixa a vida negativa', async ({ page }) => {
    await page.goto(JOGO_URL);
    await openTerminalFor(page, 'tirarVida');
    await runCode(page, 'function tirarVida(vidaInimigo, dano) {\n  if (true) { return vidaInimigo - dano; } else { return 0; }\n}');
    await expect(page.locator('#consoleOutput')).toContainText('tirarVida(2, 5) devolveu -3, mas devia devolver 0');

    await runCode(page, 'function tirarVida(vidaInimigo, dano) {\n  if (dano >= vidaInimigo) {\n    return 0;\n  } else {\n    return vidaInimigo - dano;\n  }\n}');
    await expect(page.locator('#consoleOutput')).toContainText('Código aceito');
    expect(await page.evaluate(() => window.__heroiDoCodigo.abilities.tirarVida(4, 9))).toBe(0);
  });

  test('criarInimigo devolve objeto e a arena cria inimigos com ela; depois o aluno chama a função pra montar a onda', async ({ page }) => {
    await page.goto(JOGO_URL);
    const antes = await page.evaluate(() => window.__heroiDoCodigo.enemies.length);

    await openTerminalFor(page, 'criarInimigo');
    await runCode(page, 'function criarInimigo(tipo, vida) {\n  return tipo;\n}');
    await expect(page.locator('#consoleOutput')).toContainText('precisa devolver um objeto');
    await runCode(page, 'function criarInimigo(tipo, vida) {\n  return { tipo: tipo, vida: vida };\n}');
    await expect(page.locator('#consoleOutput')).toContainText('Código aceito');
    // A arena chamou criarInimigo("slime", 3) e criarInimigo("cavaleiro", 5).
    const arena = await page.evaluate(() => window.__heroiDoCodigo.enemies.slice(-2).map(e => `${e.type}:${e.hp}`));
    expect(arena).toEqual(['slime:3', 'knight:5']);

    await page.waitForTimeout(1800); // terminal fecha sozinho depois do "Código aceito"
    await openTerminalFor(page, 'onda');
    await runCode(page, 'function criarInimigo(tipo, vida) { return { tipo, vida }; }\ncriarInimigo("slime", 2);');
    await expect(page.locator('#consoleOutput')).toContainText('já existe');
    await runCode(page, 'criarInimigo("slime", 2);');
    await expect(page.locator('#consoleOutput')).toContainText('pelo menos 2 vezes');
    await runCode(page, 'criarInimigo("dragao", 2);\ncriarInimigo("orc", 6);');
    await expect(page.locator('#consoleOutput')).toContainText('não existe');
    await runCode(page, 'criarInimigo("morcego", 1);\ncriarInimigo("orc", 6);\ncriarInimigo("slime", 2);');
    await expect(page.locator('#consoleOutput')).toContainText('3 inimigos criados');

    const total = await page.evaluate(() => window.__heroiDoCodigo.enemies.length);
    expect(total).toBe(antes + 5);
    const onda = await page.evaluate(() => window.__heroiDoCodigo.enemies.slice(-3).map(e => `${e.type}:${e.hp}`));
    expect(onda).toEqual(['bat:1', 'orc:6', 'slime:2']);
  });

  test('recarregar a página reconstrói os itens a partir do código salvo', async ({ page }) => {
    await page.goto(JOGO_URL);
    await openTerminalFor(page, 'vida');
    await page.fill('#codeInput', 'let vida = 5;');
    await page.click('#btnRun');
    await expect(page.locator('#consoleOutput')).toContainText('5 corações');

    await page.reload();
    expect(await page.evaluate(() => window.__heroiDoCodigo.abilities.vidaMax)).toBe(5);
  });
});

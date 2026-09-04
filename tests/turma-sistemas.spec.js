// @ts-check
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, expandGabaritoRow } = require('./helpers');

const URL = '/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno&name=Alexandre%20Natal&turma=sistemas';

// Banco de Dados (SQL), Redes de Computadores, Internet das Coisas, Projeto
// de Vida e Mundo do Trabalho têm trilhas de verdade — as demais matérias
// de Sistemas são placeholders vazios por enquanto.
async function openMateria1(page) {
  await page.click('.game-card:has-text("Banco de Dados")');
}

test.describe('turmas/sistemas/plataforma.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
  });

  test('carrega com tema próprio, diferente do tema de Jogos', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#txtUserNom')).toHaveText('Alexandre Natal');
    await expect(page.locator('#txtUserTurma')).toHaveText('Sistemas');

    const green = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--green').trim());
    expect(green).toBe('#3aa0ff');
    expect(green).not.toBe('#7cff3f'); // não é o verde da turma Jogos
  });

  test('mostra os cards das 10 matérias de Sistemas', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('#materiaCardGrid .game-card')).toHaveCount(10);
    await expect(page.locator('.game-card:has-text("Introdução de Desenvolvimento de Projetos")')).toContainText('Em breve');
    await expect(page.locator('#materiaCardGrid')).toContainText('Prova');
  });

  test('mostra a trilha SQL dentro de Banco de Dados, com teoria e prática', async ({ page }) => {
    await page.goto(URL);
    await openMateria1(page);
    // 2 trilhas nessa matéria (SQL / Documentação de Código) — vira um <select>, começando em "sql".
    await expect(page.locator('#trilhaSelect')).toHaveValue('sql');
    await expect(page.locator('#moduleSelector_sql')).toBeVisible();
    await expect(page.locator('#moduleSelector_sql')).toContainText('Teoria — Fundamentos de SQL');
    await expect(page.locator('#moduleSelector_sql')).toContainText('Prática — Central de Dados');
  });

  test('prática do SQL fica bloqueada até a teoria ser concluída', async ({ page }) => {
    await page.goto(URL);
    await openMateria1(page);
    // Ícone + título juntos, porque as práticas de JOIN/GROUP BY têm "Prática — Central de Dados" como prefixo do próprio título.
    const praticaCard = page.locator('#moduleSelector_sql .game-card', { hasText: '🗄️ Prática — Central de Dados' });
    await expect(praticaCard).toHaveClass(/locked/);
    await expect(praticaCard).toContainText('Bloqueado');
  });

  test('jogos ficam bloqueados até completar a trilha SQL', async ({ page }) => {
    await page.goto(URL);
    const tabJogos = page.locator('#tabBtnJogos');
    await expect(tabJogos).toHaveClass(/disabled/);
    await expect(tabJogos).toContainText('🔒');
  });

  // Projeto de Vida e Mundo do Trabalho usam as mesmas atividades da turma
  // Jogos Digitais (não são conteúdo técnico específico de nenhuma turma) —
  // só confirma que as 4 + 3 trilhas foram cadastradas certas em Sistemas.
  test('Projeto de Vida tem as 4 trilhas de Jogos Digitais, com teoria e prática', async ({ page }) => {
    await page.goto(URL);
    await page.click('.game-card:has-text("Projeto de Vida")');
    await expect(page.locator('#trilhaSelect')).toBeVisible();
    for (const value of ['vida-autoconhecimento', 'vida-cidadania', 'vida-emocional', 'vida-equipe']) {
      await expect(page.locator(`#trilhaSelect option[value="${value}"]`)).toHaveCount(1);
    }
    await expect(page.locator('#moduleSelector_vida-autoconhecimento')).toContainText('Autoconhecimento e Valores Pessoais');
  });

  test('Mundo do Trabalho tem as 3 trilhas de Jogos Digitais, com teoria e prática', async ({ page }) => {
    await page.goto(URL);
    await page.click('.game-card:has-text("Mundo do Trabalho")');
    await expect(page.locator('#trilhaSelect')).toBeVisible();
    for (const value of ['mundo-revolucao', 'mundo-inovacao', 'mundo-equipe']) {
      await expect(page.locator(`#trilhaSelect option[value="${value}"]`)).toHaveCount(1);
    }
    await expect(page.locator('#moduleSelector_mundo-revolucao')).toContainText('Revoluções Industriais e Indústria 4.0');
  });

  // O rótulo de turma ("Turma Jogos Digitais"/"Turma Sistemas") não aparece
  // na tela do aluno — só no cabeçalho do gabarito/slides gerados pro
  // professor (subtitle em generateGabaritoForGestao). A cópia dos arquivos
  // de Jogos pra Sistemas precisa ter corrigido esse texto embutido, senão
  // o gabarito de uma atividade de Sistemas diria "Turma Jogos Digitais".
  test('gabarito de Projeto de Vida gerado em Sistemas diz "Turma Sistemas", não "Jogos Digitais"', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/sistemas/plataforma.html?user=admin&ip=192.168.2.254&saldo=9999.00&role=professor&turma=sistemas');
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = await expandGabaritoRow(page, 'Autoconhecimento e Valores Pessoais');
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Turma Sistemas');
    expect(content).not.toContain('Jogos Digitais');
  });

  // db-conexao-supabase-pratica.html não tem alternativas certo/errado (é
  // um roteiro guiado com visto do professor) — o gabarito lista as
  // perguntas de "Responda no seu caderno" com uma resposta modelo, pro
  // professor conferir sem precisar abrir o roteiro inteiro de novo.
  test('gabarito da atividade de Conexão com Supabase lista as perguntas do caderno com resposta modelo', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/sistemas/plataforma.html?user=admin&ip=192.168.2.254&saldo=9999.00&role=professor&turma=sistemas');
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = await expandGabaritoRow(page, 'Sistema Web com HTML, JavaScript e Supabase');
    await expect(row).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('db-conexao-supabase-pratica-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('O que significa RLS?');
    expect(content).toContain('RESPOSTA ESPERADA: Row Level Security');
    expect(content).toContain('Por que uma chave sb_secret_... não deve estar no JavaScript?');

    // Além das perguntas de reflexão, o gabarito também traz o código
    // completo que o roteiro manda digitar — puxado direto dos blocos
    // §§§ do roteiro (extractCodeBlocks), não retranscrito à mão.
    expect(content).toContain('index.html — formulário completo');
    expect(content).toContain('<form id="formCadastro">');
    expect(content).toContain('usuarios — CREATE TABLE');
    expect(content).toContain('create table usuarios (');
    expect(content).toContain('cadastrarUsuario() — versão final');
    // versão final (ETAPA 30, com validação), não a inicial da ETAPA 21/22.
    expect(content).toContain('mensagem.textContent = "Preencha o nome."');
    expect(content).toContain('carregarUsuarios() — versão final');
    // versão final (ETAPA 27, desenhando a lista), não a inicial da ETAPA 18.
    expect(content).toContain('lista.appendChild(item)');
    expect(content).toContain('Policy de leitura');
    expect(content).toContain('create policy "permitir leitura"');
    expect(content).toContain('Policy de inserção');
    expect(content).toContain('create policy "permitir insercao"');
  });
});

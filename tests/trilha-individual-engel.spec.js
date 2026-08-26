// @ts-check
// Trilha individual "JavaScript Básico (Engel)" — atividade adaptada,
// visível só pro aluno listado em trilha.visibleFor (config.js) e sempre
// pro professor (trilhaStatus() em shared/platform-core.js reaproveita o
// status 'futura' já usado por trilha com início no futuro). Cobre o ponto
// mais sensível: não pode vazar pra outros alunos, e não pode travar o
// desbloqueio de jogos do resto da turma por uma trilha que eles nem veem.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const PROFESSOR_URL = '/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos';
const ENGEL_URL = '/turmas/jogos/plataforma.html?user=engel.fraga&ip=192.168.1.20&saldo=1000.00&role=aluno&turma=jogos';
const BRENO_URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos';

async function openFundamentos(page) {
  await page.click('.game-card:has-text("Fundamentos de Programação")');
}

// Seed com token de professor pro fake client validar o "Pular
// (professor)" — mesmo padrão usado em db-conexao-supabase.spec.js e
// cobrinha-construcao.spec.js.
const TOKEN_VALIDO = '482913';
const SEED_PROFESSOR = {
  profiles: [
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
  professor_tokens: [
    { token: TOKEN_VALIDO, created_by: 'fake-admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  ],
};

test.describe('Trilha individual "JavaScript Básico (Engel)"', () => {
  test('professor sempre vê a trilha, mesmo não estando na lista de visibleFor', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(PROFESSOR_URL);
    await openFundamentos(page);
    await expect(page.locator('#trilhaSelect option[value="js-adaptado-engel"]')).toHaveCount(1);
  });

  test('engel.fraga vê a própria trilha e consegue abrir o módulo', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await openFundamentos(page);
    await expect(page.locator('#trilhaSelect option[value="js-adaptado-engel"]')).toHaveCount(1);

    await page.selectOption('#trilhaSelect', 'js-adaptado-engel');
    await expect(page.locator('#subTabContent_js-adaptado-engel')).toBeVisible();
    await page.click('#moduleSelector_js-adaptado-engel .game-card');
    await expect(page.locator('#moduleFrame_js-adaptado-engel')).toHaveAttribute(
      'src', /atividades\/js-basico-adaptado-engel\.html\?user=engel\.fraga/
    );
  });

  test('outro aluno (fora da lista) não vê a trilha', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(BRENO_URL);
    await openFundamentos(page);
    await expect(page.locator('#trilhaSelect option[value="js-adaptado-engel"]')).toHaveCount(0);
  });

  test('a trilha do Engel não trava o desbloqueio de jogos do resto da turma', async ({ page }) => {
    // Mesma seed de "todos os módulos concluídos" usada em turma-jogos.spec.js,
    // sem tocar em js_basico_adaptado_engel_progress — se o gate contasse essa
    // trilha pra quem não pode nem vê-la, os jogos ficariam bloqueados pra
    // sempre pro resto da turma.
    await stubSupabaseFake(page, {});
    await page.addInitScript(user => {
      const dez = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const cinco = [1, 2, 3, 4, 5];
      const dezoito = Array.from({ length: 18 }, (_, i) => i + 1);
      const teoriaFlag = [
        'vida_autoconhecimento_teoria', 'vida_cidadania_teoria', 'vida_emocional_teoria', 'vida_equipe_teoria',
        'vida_metas_carreira_teoria',
        'mundo_revolucao_teoria', 'mundo_inovacao_teoria', 'mundo_equipe_teoria', 'mundo_comprometimento_teoria',
        'projetos_metodos_teoria', 'projetos_fases_teoria',
        'cod_ide_teoria', 'cod_linguagens_teoria', 'cod_seguranca_debug_teoria', 'cod_poo_teoria', 'cod_agil_clean_teoria', 'cod_seguranca_ia_teoria',
        'fund_ambiente_teoria', 'fund_logica_teoria', 'fund_prog2d_teoria', 'fund_multimidia_teoria',
        'teste_fundamentos_teoria', 'teste_planejamento_teoria', 'teste_execucao_teoria'
      ];
      teoriaFlag.forEach(k => localStorage.setItem(`${k}_progress_${user}`, JSON.stringify({ completed: true })));
      localStorage.setItem(`csharp_basico_progress_${user}`, JSON.stringify({ completed: true }));
      localStorage.setItem(`gdscript_basico_progress_${user}`, JSON.stringify({ completed: true }));
      localStorage.setItem(`cobrinha_construcao_progress_${user}`, JSON.stringify({ completed: true }));

      const praticaDez = [
        'mundo_revolucao_pratica', 'mundo_inovacao_pratica', 'mundo_equipe_pratica',
        'projetos_metodos_pratica', 'projetos_fases_pratica',
        'cod_ide_pratica', 'cod_linguagens_pratica', 'cod_seguranca_debug_pratica', 'cod_poo_pratica', 'cod_agil_clean_pratica', 'cod_seguranca_ia_pratica',
        'fund_ambiente_pratica', 'fund_logica_pratica', 'fund_prog2d_pratica', 'fund_multimidia_pratica',
        'csharp_pratica', 'gdscript_pratica',
        'teste_fundamentos_pratica', 'teste_planejamento_pratica', 'teste_execucao_pratica'
      ];
      praticaDez.forEach(k => localStorage.setItem(`${k}_progress_${user}`, JSON.stringify(dez)));
      localStorage.setItem(`js_basico_progress_${user}`, JSON.stringify(dez));
      localStorage.setItem(`js_intermediario_progress_${user}`, JSON.stringify(dezoito));

      const praticaCinco = ['vida_autoconhecimento_pratica', 'vida_cidadania_pratica', 'vida_emocional_pratica', 'vida_equipe_pratica'];
      praticaCinco.forEach(k => localStorage.setItem(`${k}_progress_${user}`, JSON.stringify(cinco)));

      localStorage.setItem(`vida_metas_carreira_pratica_progress_${user}`, JSON.stringify([1]));
      localStorage.setItem(`mundo_comprometimento_pratica_progress_${user}`, JSON.stringify([1]));
    }, 'breno.silva80');

    await page.goto(BRENO_URL);
    await expect(page.locator('#tabBtnJogos')).not.toHaveClass(/disabled/);
  });

  test('resolver o 1º passo libera o 2º, e o progresso é salvo', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await openFundamentos(page);
    await page.selectOption('#trilhaSelect', 'js-adaptado-engel');
    await page.click('#moduleSelector_js-adaptado-engel .game-card');

    const frame = page.frameLocator('#moduleFrame_js-adaptado-engel');
    await expect(frame.locator('#challengeTitle')).toContainText('Guardar um número');
    await frame.locator('#codeInput').fill('let resultado = 5;');
    await frame.locator('#btnRun').click();
    await expect(frame.locator('.console')).toContainText('Acertou');
    await expect(frame.locator('#btnNext')).toBeVisible();
  });

  test('emojis grandes das palavras conhecidas aparecem no desafio, e somem quando não há palavra conhecida', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(() => {
      localStorage.setItem('js_basico_adaptado_engel_progress_engel.fraga', JSON.stringify([1, 2, 3, 4, 5]));
    });
    await page.goto(ENGEL_URL);
    await openFundamentos(page);
    await page.selectOption('#trilhaSelect', 'js-adaptado-engel');
    await page.click('#moduleSelector_js-adaptado-engel .game-card');

    const frame = page.frameLocator('#moduleFrame_js-adaptado-engel');
    await expect(frame.locator('#challengeTitle')).toContainText('Multiplicar');
    await expect(frame.locator('#vocabRow')).toBeVisible();
    await expect(frame.locator('#vocabRow')).toContainText('🐱');
    await expect(frame.locator('#vocabRow')).toContainText('gato');

    await frame.locator('.step-icon').first().click();
    await expect(frame.locator('#challengeTitle')).toContainText('Guardar');
    await expect(frame.locator('#vocabRow')).toBeHidden();
  });

  test('botão "Pular (professor)" exige token válido antes de pular a etapa', async ({ page }) => {
    await stubSupabaseFake(page, SEED_PROFESSOR);
    await page.goto(ENGEL_URL);
    await openFundamentos(page);
    await page.selectOption('#trilhaSelect', 'js-adaptado-engel');
    await page.click('#moduleSelector_js-adaptado-engel .game-card');

    const frame = page.frameLocator('#moduleFrame_js-adaptado-engel');
    await expect(frame.locator('#challengeTitle')).toContainText('Guardar um número');

    // Token errado não pula a etapa.
    await frame.locator('#btnSkip').click();
    await expect(frame.locator('#skipForm')).toBeVisible();
    await frame.locator('#skipToken').fill('000000');
    await frame.locator('#btnConfirmSkip').click();
    await expect(frame.locator('#skipMsg')).toContainText('inválido ou expirado');
    await expect(frame.locator('#btnNext')).toBeHidden();

    // Token correto do professor pula a etapa sem rodar o código.
    await frame.locator('#skipToken').fill(TOKEN_VALIDO);
    await frame.locator('#btnConfirmSkip').click();
    await expect(frame.locator('.console')).toContainText('Pulado pelo professor');
    await expect(frame.locator('#btnNext')).toBeVisible();
  });
});

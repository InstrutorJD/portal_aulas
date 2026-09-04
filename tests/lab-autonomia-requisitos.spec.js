// @ts-check
// Trilha "Laboratório de Autonomia: Análise de Requisitos" (Modelagem de
// Sistemas 1, turma Sistemas): atividade PRESENCIAL sem correção
// automática — o aluno só lê o roteiro; quem avalia é o professor, à
// distância, na Ficha de Observação Comportamental da Gestão (tabela
// behavioral_observations). Sem visto por token: a última etapa do
// roteiro só LÊ o resultado que o professor salvou.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const ACTIVITY_URL = '/turmas/sistemas/atividades/lab-autonomia-requisitos-roteiro.html?user=alexandre.natal&role=aluno&turma=sistemas';

const SEED = {
  profiles: [
    { id: 'fake-alexandre.natal', email: 'alexandre.natal', nome: 'Alexandre Natal', role: 'aluno', turma: 'sistemas' },
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
};

test.describe('turmas/sistemas — trilha Laboratório de Autonomia', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('aparece na matéria Modelagem de Sistemas 1, ao lado de Modelagem de Dados e Requisitos', async ({ page }) => {
    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.click('.game-card:has-text("Modelagem de Sistemas 1")');
    await page.selectOption('#trilhaSelect', 'lab-autonomia-requisitos');
    await expect(page.locator('#moduleSelector_lab-autonomia-requisitos')).toContainText('Laboratório de Autonomia');
  });

  test('navega pelas 4 telas de roteiro com Voltar/Próximo e lembra onde o aluno parou', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    await expect(page.locator('.card h2')).toHaveText('Apresentação');

    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Bloco — Técnicas de análise de requisitos');
    await page.click('#btnNext');
    await expect(page.locator('.card h2')).toHaveText('Bloco — Requisitos ambíguos pra analisar');

    await page.reload();
    await expect(page.locator('.card h2')).toHaveText('Bloco — Requisitos ambíguos pra analisar');

    await page.click('#btnBack');
    await expect(page.locator('.card h2')).toHaveText('Bloco — Técnicas de análise de requisitos');
  });

  test('sem avaliação ainda, mostra "aguardando" e não marca progresso', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');

    await expect(page.locator('.resultado-box h2')).toContainText('Aguardando avaliação do professor');

    const progress = await page.evaluate(u => localStorage.getItem(`lab_autonomia_requisitos_progress_${u}`), 'alexandre.natal');
    expect(progress).toBeNull();
  });

  test('depois que o professor avalia, o aluno vê o resultado e o progresso é marcado como concluído', async ({ page }) => {
    await page.goto(ACTIVITY_URL);
    const total = await page.evaluate(() => STEPS.length);
    for (let i = 0; i < total; i++) await page.click('#btnNext');
    await expect(page.locator('.resultado-box h2')).toContainText('Aguardando avaliação do professor');

    // Simula o professor salvando a ficha de observação (mesma tabela que
    // shared/platform-core.js grava) — addInitScript (não page.evaluate)
    // porque stubSupabaseFake já registrou um addInitScript que reseta
    // window.__FAKE_DB__ pro SEED original a cada navegação; um segundo
    // addInitScript roda DEPOIS do primeiro em toda nova página, inclusive
    // no reload logo abaixo, então sobrevive à navegação.
    await page.addInitScript(() => {
      window.__FAKE_DB__ = window.__FAKE_DB__ || {};
      window.__FAKE_DB__.behavioral_observations = [
        {
          student_email: 'alexandre.natal', student_name: 'Alexandre Natal', turma: 'sistemas',
          atividade_key: 'lab_autonomia_requisitos', avaliacao: 'demonstrou',
          observacoes: 'Analisou os 3 requisitos sozinho e justificou as decisões.',
          observado_por: 'Instrutor / Professor', updated_at: new Date().toISOString(),
        },
      ];
    });
    await page.reload();

    await expect(page.locator('.resultado-box h2')).toContainText('Atividade avaliada');
    await expect(page.locator('.avaliacao-tag')).toContainText('Demonstrou autonomia');
    await expect(page.locator('.resultado-box')).toContainText('Instrutor / Professor');
    await expect(page.locator('.observacoes-box')).toContainText('justificou as decisões');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`lab_autonomia_requisitos_progress_${u}`)), 'alexandre.natal');
    expect(progress).toMatchObject({ completed: true, avaliacao: 'demonstrou' });
  });
});

test.describe('Gestão — Ficha de Observação Comportamental', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {
      profiles: [
        { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
        { id: 'fake-alexandre.natal', email: 'alexandre.natal', nome: 'Alexandre Natal', role: 'aluno', turma: 'sistemas' },
      ],
    });
  });

  async function openFichaObservacao(page) {
    await page.goto('/turmas/sistemas/plataforma.html?user=admin&ip=192.168.2.254&saldo=9999.00&role=professor&turma=sistemas');
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Ficha de Observação' }).click();
  }

  test('lista os alunos da turma e salva a avaliação escolhida', async ({ page }) => {
    await openFichaObservacao(page);

    const row = page.locator('#fichaObservacaoBody tr', { hasText: 'Alexandre Natal' });
    await expect(row).toBeVisible();

    await row.locator('.ficha-observacao-avaliacao').selectOption('demonstrou');
    await row.locator('.ficha-observacao-obs').fill('Tomou a decisão sozinho e explicou o motivo.');
    await page.click('#btnSalvarFichaObservacao');

    await expect(page.locator('#fichaObservacaoStatus')).toContainText('Salvo às');

    const saved = await page.evaluate(() => window.__FAKE_DB__.behavioral_observations || []);
    expect(saved).toContainEqual(expect.objectContaining({
      student_email: 'alexandre.natal',
      atividade_key: 'lab_autonomia_requisitos',
      avaliacao: 'demonstrou',
      observacoes: 'Tomou a decisão sozinho e explicou o motivo.',
    }));
  });

  test('reabrir a Gestão mostra a avaliação já salva pré-selecionada', async ({ page }) => {
    await page.addInitScript(() => {
      window.__FAKE_DB__ = window.__FAKE_DB__ || {};
      window.__FAKE_DB__.behavioral_observations = [
        {
          student_email: 'alexandre.natal', student_name: 'Alexandre Natal', turma: 'sistemas',
          atividade_key: 'lab_autonomia_requisitos', avaliacao: 'em_desenvolvimento',
          observacoes: '', observado_por: 'Instrutor / Professor', updated_at: new Date().toISOString(),
        },
      ];
    });
    await openFichaObservacao(page);

    const row = page.locator('#fichaObservacaoBody tr', { hasText: 'Alexandre Natal' });
    await expect(row.locator('.ficha-observacao-avaliacao')).toHaveValue('em_desenvolvimento');
  });
});

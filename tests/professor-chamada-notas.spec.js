// @ts-check
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const URL = '/professor/painel.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor';
const today = new Date().toISOString().slice(0, 10);

test.describe('professor/painel.html — Chamada', () => {
  test('marcar falta e finalizar salva presente=false só pro aluno marcado', async ({ page }) => {
    await stubSupabaseFake(page, { attendance: [] });
    await page.goto(URL);
    await page.click('#painelTabs .tab-btn[data-tab="chamada"]');

    await page.selectOption('#chamadaTurma', 'jogos');
    await page.waitForTimeout(200);

    await page.check('#chamadaBody input[data-email="breno.silva80"]');
    await page.click('#btnFinalizarChamada');

    await expect(page.locator('#chamadaStatus')).toContainText('Chamada registrada');

    const rows = await page.evaluate(() => window.__FAKE_DB__.attendance || []);
    const breno = rows.find(r => r.student_email === 'breno.silva80');
    const outro = rows.find(r => r.student_email !== 'breno.silva80');

    expect(breno.presente).toBe(false);
    expect(breno.turma).toBe('jogos');
    expect(breno.data).toBe(today);
    expect(outro.presente).toBe(true);
  });

  test('reabrir a mesma data pré-marca quem já tinha sido registrado como falta', async ({ page }) => {
    await stubSupabaseFake(page, {
      attendance: [
        { turma: 'jogos', data: today, student_email: 'breno.silva80', student_name: 'Breno Silva', presente: false },
      ],
    });
    await page.goto(URL);
    await page.click('#painelTabs .tab-btn[data-tab="chamada"]');
    await page.selectOption('#chamadaTurma', 'jogos');
    await page.waitForTimeout(200);

    await expect(page.locator('#chamadaBody input[data-email="breno.silva80"]')).toBeChecked();
  });

  test('relatório de presença calcula % corretamente a partir do histórico', async ({ page }) => {
    await stubSupabaseFake(page, {
      attendance: [
        { turma: 'jogos', data: '2026-03-01', student_email: 'breno.silva80', presente: true },
        { turma: 'jogos', data: '2026-03-02', student_email: 'breno.silva80', presente: false },
        { turma: 'jogos', data: '2026-03-03', student_email: 'breno.silva80', presente: true },
        { turma: 'jogos', data: '2026-03-04', student_email: 'breno.silva80', presente: true },
      ],
    });
    await page.goto(URL);
    await page.click('#painelTabs .tab-btn[data-tab="chamada"]');
    await page.selectOption('#presencaTurma', 'jogos');
    await page.waitForTimeout(200);

    const row = page.locator('#presencaBody tr', { hasText: 'Breno Silva' });
    await expect(row).toContainText('4'); // dias com chamada
    await expect(row).toContainText('1'); // faltas
    await expect(row).toContainText('75%'); // 3 presenças de 4 dias
  });
});

test.describe('professor/painel.html — Notas', () => {
  test('média recalcula ao vivo enquanto digita e salvar grava as 4 notas', async ({ page }) => {
    await stubSupabaseFake(page, { grades: [] });
    await page.goto(URL);
    await page.click('#painelTabs .tab-btn[data-tab="notas"]');
    await page.selectOption('#notasTurma', 'jogos');
    await page.selectOption('#notasBimestre', '1');
    await page.waitForTimeout(200);

    const row = page.locator('#notasBody tr[data-email="breno.silva80"]');
    await row.locator('[data-campo="nota1"]').fill('10');
    await row.locator('[data-campo="nota2"]').fill('8');
    await row.locator('[data-campo="nota3"]').fill('6');
    await row.locator('[data-campo="nota4"]').fill('4');

    await expect(row.locator('.media-cell')).toHaveText('7.00');

    await page.click('#btnSalvarNotas');
    await expect(page.locator('#notasStatus')).toContainText('Notas salvas');

    const saved = await page.evaluate(() =>
      (window.__FAKE_DB__.grades || []).find(r => r.student_email === 'breno.silva80' && r.bimestre === 1)
    );
    expect(saved).toMatchObject({ nota1: 10, nota2: 8, nota3: 6, nota4: 4, turma: 'jogos' });
  });

  test('relatório de notas mostra só médias e o % de desempenho por trilha', async ({ page }) => {
    await stubSupabaseFake(page, {
      grades: [
        { student_email: 'alexandre.natal', student_name: 'Alexandre Natal', turma: 'sistemas', bimestre: 1, nota1: 10, nota2: 10, nota3: 10, nota4: 10, media: 10 },
        { student_email: 'alexandre.natal', student_name: 'Alexandre Natal', turma: 'sistemas', bimestre: 2, nota1: 8, nota2: 8, nota3: 8, nota4: 8, media: 8 },
      ],
      student_module_progress: [
        { student_email: 'alexandre.natal', turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true },
        { student_email: 'alexandre.natal', turma: 'sistemas', trilha_key: 'sql', module_key: 'basico', progress_current: 4, progress_total: 8, completed: false },
      ],
    });
    await page.goto(URL);
    await page.click('#painelTabs .tab-btn[data-tab="notas"]');
    await page.selectOption('#relatorioNotasTurma', 'sistemas');
    await page.waitForTimeout(200);

    // Só a média aparece no relatório — nunca os 4 campos de nota.
    await expect(page.locator('#relatorioNotasBody')).not.toContainText('nota1');

    const row = page.locator('#relatorioNotasBody tr', { hasText: 'Alexandre Natal' });
    await expect(row).toContainText('10.00'); // média B1
    await expect(row).toContainText('8.00');  // média B2
    await expect(row).toContainText('9.00');  // média geral (10 e 8, sem B3/B4)
    await expect(row).toContainText('75%');   // trilha SQL: teoria 100% + básico 4/8=50% => média 75%
  });
});

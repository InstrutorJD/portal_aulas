// @ts-check
const { test, expect } = require('@playwright/test');
const { stubSupabaseDisabled, stubSupabaseFake } = require('./helpers');

const JOGOS_URL = '/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos';
const ALUNO_URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos';

test.describe('Aba Gestão (só professor) dentro do portal da turma', () => {
  test('aluno não vê a aba Gestão', async ({ page }) => {
    await stubSupabaseDisabled(page);
    await page.goto(ALUNO_URL);
    await expect(page.locator('#mainNavTabs .tab-btn[data-tab="gestao"]')).toHaveCount(0);
  });

  test('professor vê só os alunos desta turma, não os de Sistemas', async ({ page }) => {
    await stubSupabaseFake(page, { student_overrides: [] });
    await page.goto(JOGOS_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);

    await expect(page.locator('#tblGestaoStudentsBody')).toContainText('Breno Silva');
    await expect(page.locator('#tblGestaoStudentsBody')).not.toContainText('Alexandre Natal');
  });

  test('liberar jogos de um aluno específico grava o override certo', async ({ page }) => {
    await stubSupabaseFake(page, { student_overrides: [] });
    await page.goto(JOGOS_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);

    const row = page.locator('#tblGestaoStudentsBody tr', { hasText: 'Breno Silva' });
    await expect(row).toContainText('BLOQUEADO');
    await row.locator('button').click();
    await expect(row).toContainText('LIBERADO');

    const rows = await page.evaluate(() => window.__FAKE_DB__.student_overrides || []);
    expect(rows.find(r => r.student_email === 'breno.silva80')).toMatchObject({ games_unlocked: true });
  });

  test('liberar jogos (todos) só afeta alunos desta turma', async ({ page }) => {
    await stubSupabaseFake(page, { student_overrides: [] });
    await page.goto(JOGOS_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);

    await page.click('#btnUnlockGamesTurma');
    await page.waitForTimeout(200);

    const rows = await page.evaluate(() => window.__FAKE_DB__.student_overrides || []);
    expect(rows.some(r => r.student_email === 'breno.silva80' && r.games_unlocked === true)).toBe(true);
    expect(rows.some(r => r.student_email === 'alexandre.natal')).toBe(false);
  });

  test('bloquear Ctrl+C/V grava configuração com id da turma, não "global"', async ({ page }) => {
    await stubSupabaseFake(page, { classroom_settings: [] });
    await page.goto(JOGOS_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);

    await expect(page.locator('#btnToggleClipboard')).toContainText('Bloquear Copiar/Colar (Jogos Digitais)');
    await page.click('#btnToggleClipboard');
    await expect(page.locator('#btnToggleClipboard')).toContainText('BLOQUEADO');

    const rows = await page.evaluate(() => window.__FAKE_DB__.classroom_settings || []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'jogos', clipboard_blocked: true });
  });

  test('atividade em tempo real mostra só alunos desta turma', async ({ page }) => {
    await stubSupabaseFake(page, {
      student_activity: [
        { student_email: 'breno.silva80', student_name: 'Breno Silva', turma: 'jogos', status: 'active', location_label: 'JavaScript', updated_at: new Date().toISOString() },
        { student_email: 'alexandre.natal', student_name: 'Alexandre Natal', turma: 'sistemas', status: 'idle', location_label: 'Aulas', updated_at: new Date().toISOString() },
      ],
    });
    await page.goto(JOGOS_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);

    const rows = page.locator('#tblGestaoActivityBody tr');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('#tblGestaoActivityBody')).toContainText('Breno Silva');
    await expect(page.locator('#tblGestaoActivityBody')).not.toContainText('Alexandre Natal');
  });
});

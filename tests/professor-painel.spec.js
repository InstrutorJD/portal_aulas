// @ts-check
const { test, expect } = require('@playwright/test');
const { stubSupabaseDisabled, stubSupabaseFake } = require('./helpers');

const URL = '/professor/painel.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor';

test.describe('professor/painel.html', () => {
  test('lista alunos das duas turmas na mesma tabela', async ({ page }) => {
    await stubSupabaseDisabled(page);
    await page.goto(URL);

    await expect(page.locator('#sessionUser')).toHaveText('Instrutor / Professor');

    const rows = page.locator('#tblStudentsBody tr');
    await expect(rows).toHaveCount(17 + 28); // alunos de Jogos + Sistemas

    await expect(page.locator('#tblStudentsBody')).toContainText('JOGOS');
    await expect(page.locator('#tblStudentsBody')).toContainText('SISTEMAS');
    await expect(page.locator('#tblStudentsBody')).toContainText('Breno Silva');
    await expect(page.locator('#tblStudentsBody')).toContainText('Alexandre Natal');
  });

  test('links de preview apontam pro portal de cada turma', async ({ page }) => {
    await stubSupabaseDisabled(page);
    await page.goto(URL);

    await expect(page.locator('a:has-text("Portal — Jogos Digitais")')).toHaveAttribute(
      'href', /turmas\/jogos\/plataforma\.html/
    );
    await expect(page.locator('a:has-text("Portal — Sistemas")')).toHaveAttribute(
      'href', /turmas\/sistemas\/plataforma\.html/
    );
  });

  test('atividade em tempo real mostra alunos das duas turmas quando o Supabase responde', async ({ page }) => {
    await stubSupabaseFake(page, {
      student_activity: [
        { student_email: 'breno.silva80', student_name: 'Breno Silva', turma: 'jogos', status: 'active', location_label: 'JavaScript', updated_at: new Date().toISOString() },
        { student_email: 'alexandre.natal', student_name: 'Alexandre Natal', turma: 'sistemas', status: 'idle', location_label: 'Aulas', updated_at: new Date().toISOString() },
      ],
      student_overrides: [],
    });
    await page.goto(URL);

    const activityRows = page.locator('#tblActivityBody tr');
    await expect(activityRows).toHaveCount(2);
    await expect(page.locator('#tblActivityBody')).toContainText('Breno Silva');
    await expect(page.locator('#tblActivityBody')).toContainText('Alexandre Natal');
  });
});

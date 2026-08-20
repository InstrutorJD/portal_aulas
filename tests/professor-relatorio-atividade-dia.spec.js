// @ts-check
// Relatório de Atividade do Dia (dentro de "Relatórios", na aba Gestão):
// sob demanda (botão "Gerar"), lista os alunos PRESENTES hoje que ainda não
// concluíram nenhuma atividade hoje, com o tempo que cada um ficou logado
// hoje (aproximado por active_seconds_today, acumulado por um gatilho no
// Supabase a partir do heartbeat de shared/activity-tracker.js).
//
// "Concluiu hoje" olha completed_at (carimbado só no instante em que um
// módulo vira completed=true de verdade — ver trigger em
// sql/supabase-setup-completo.sql, bloco 7), não updated_at, que muda toda vez que o
// portal carrega mesmo sem progresso nenhum. Quem foi marcado como falta
// (attendance.presente = false) na chamada de hoje nunca aparece na lista.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const SISTEMAS_URL = '/turmas/sistemas/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=sistemas';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function openGestao(page, seed) {
  await stubSupabaseFake(page, seed);
  await page.goto(SISTEMAS_URL);
  await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
  await page.waitForTimeout(200);
}

async function expandGestaoSection(page, titulo) {
  await page.locator('.collapsible-card .collapsible-head', { hasText: titulo }).click();
}

test.describe('Relatório de Atividade do Dia — dentro do portal da turma', () => {
  test('lista só quem está presente hoje e não concluiu nada hoje', async ({ page }) => {
    const today = todayStr();
    await openGestao(page, {
      profiles: [
        { id: 'fake-bianca.bernardi', email: 'bianca.bernardi', nome: 'Bianca Bernardi', role: 'aluno', turma: 'sistemas' },
        { id: 'fake-bruno.gomes1', email: 'bruno.gomes1', nome: 'Bruno Gomes', role: 'aluno', turma: 'sistemas' },
        { id: 'fake-alexandre.natal', email: 'alexandre.natal', nome: 'Alexandre Natal', role: 'aluno', turma: 'sistemas' },
      ],
      attendance: [
        // bianca.bernardi: marcada como FALTA hoje — nunca deve aparecer na lista.
        { turma: 'sistemas', data: today, student_email: 'bianca.bernardi', student_name: 'Bianca Bernardi', presente: false },
      ],
      student_module_progress: [
        // bruno.gomes1: concluiu um módulo HOJE — não deve aparecer.
        { student_email: 'bruno.gomes1', turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true, completed_at: `${today}T09:00:00.000Z` },
        // alexandre.natal: concluiu um módulo em outro dia — deve aparecer (nada concluído HOJE).
        { student_email: 'alexandre.natal', turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true, completed_at: '2020-01-01T09:00:00.000Z' },
      ],
      student_activity: [
        // alexandre.natal ficou 45min logado hoje, mesmo sem concluir nada.
        { student_email: 'alexandre.natal', turma: 'sistemas', active_seconds_today: 2700, activity_date: today },
      ],
    });
    await expandGestaoSection(page, 'Relatórios');

    await page.click('#btnGerarAtividadeDia');

    const resultado = page.locator('#atividadeDiaResultado');
    await expect(resultado).toContainText('Alexandre Natal');
    await expect(resultado).toContainText('45min');
    await expect(resultado).not.toContainText('Bianca Bernardi');
    await expect(resultado).not.toContainText('Bruno Gomes');
  });

  test('sem nenhum registro de atividade hoje, mostra travessão em vez de tempo', async ({ page }) => {
    const today = todayStr();
    await openGestao(page, {
      profiles: [
        { id: 'fake-erasmo.prado', email: 'erasmo.prado', nome: 'Erasmo Prado', role: 'aluno', turma: 'sistemas' },
      ],
      // erasmo.prado tem um registro de atividade, mas de ONTEM — não conta pra hoje.
      student_activity: [
        { student_email: 'erasmo.prado', turma: 'sistemas', active_seconds_today: 1800, activity_date: '2020-01-01' },
      ],
    });
    await expandGestaoSection(page, 'Relatórios');

    await page.click('#btnGerarAtividadeDia');

    const row = page.locator('#atividadeDiaResultado tr', { hasText: 'Erasmo Prado' });
    await expect(row).toContainText('—');
  });

  test('quando todo mundo presente já concluiu algo hoje, mostra a mensagem de sucesso', async ({ page }) => {
    const today = todayStr();

    // A lista de alunos da turma agora vem de `profiles` (Supabase Auth),
    // não mais de shared/users-db.js — semeia um punhado de alunos fixos
    // pra turma Sistemas, com progresso concluído HOJE pra todos.
    const emails = ['alexandre.natal', 'bianca.bernardi', 'bruno.gomes1'];
    const progressRows = emails.map(email => ({
      student_email: email, turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria',
      progress_current: 1, progress_total: 1, completed: true, completed_at: `${today}T09:00:00.000Z`,
    }));

    await openGestao(page, {
      profiles: emails.map(email => ({ id: `fake-${email}`, email, nome: email, role: 'aluno', turma: 'sistemas' })),
      student_module_progress: progressRows,
    });
    await expandGestaoSection(page, 'Relatórios');

    await page.click('#btnGerarAtividadeDia');
    await expect(page.locator('#atividadeDiaResultado')).toContainText('já concluíram alguma atividade');
  });

  // Removido: "logado como professor, mas sbClient nulo" não é mais um
  // estado alcançável — login agora exige Supabase Auth configurado, e
  // sbClient (shared/platform-core.js) vem da mesma checagem que a sessão
  // já usou pra autenticar. O guard `if (!sbClient)` continua no código-
  // fonte por segurança, só não há mais como exercitá-lo por trás de um
  // login bem-sucedido.
});

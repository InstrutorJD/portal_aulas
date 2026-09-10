// @ts-check
// Chamada e notas agora vivem dentro da aba "Gestão" do portal de cada
// turma (shared/platform-core.js), não mais num painel central — por isso
// não existe mais seletor de turma aqui: a turma já é a do portal aberto.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, jogosAlunoProfiles, sistemasAlunoProfiles } = require('./helpers');

const JOGOS_URL = '/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos';
const SISTEMAS_URL = '/turmas/sistemas/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=sistemas';
const today = new Date().toISOString().slice(0, 10);
const thisMonth = today.slice(0, 7); // 'YYYY-MM' — o "mês atual" que o relatório de presença usa

// A tabela de chamada/notas lista turmaStudents() (profiles) — semeia o
// roster certo pra turma da URL, além do que o teste já pedir.
async function openGestao(page, url, seed) {
  const profiles = url === SISTEMAS_URL ? sistemasAlunoProfiles() : jogosAlunoProfiles();
  await stubSupabaseFake(page, { ...seed, profiles: [...(seed.profiles || []), ...profiles] });
  await page.goto(url);
  await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
  await page.waitForTimeout(200);
}

// As seções da aba Gestão vêm reduzidas por padrão — precisa expandir antes de mexer no conteúdo.
async function expandGestaoSection(page, titulo) {
  await page.locator('.collapsible-card .collapsible-head', { hasText: titulo }).click();
}

test.describe('Chamada — dentro do portal da turma', () => {
  test('marcar falta e finalizar salva presente=false só pro aluno marcado', async ({ page }) => {
    await openGestao(page, JOGOS_URL, { attendance: [] });
    await expandGestaoSection(page, 'Chamada e Notas');

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
    await openGestao(page, JOGOS_URL, {
      attendance: [
        { turma: 'jogos', data: today, student_email: 'breno.silva80', student_name: 'Breno Silva', presente: false },
      ],
    });
    await expandGestaoSection(page, 'Chamada e Notas');

    await expect(page.locator('#chamadaBody input[data-email="breno.silva80"]')).toBeChecked();
  });

  test('finalizar gera um resumo copiável com turma abreviada, data, presentes e ausentes', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openGestao(page, JOGOS_URL, { attendance: [] });
    await expandGestaoSection(page, 'Chamada e Notas');

    await page.check('#chamadaBody input[data-email="breno.silva80"]');
    await page.click('#btnFinalizarChamada');

    await expect(page.locator('#chamadaResumoBox')).toBeVisible();
    const resumo = await page.locator('#chamadaResumoTexto').inputValue();
    expect(resumo).toContain('Turma: JD');
    expect(resumo).toContain(`Data: ${today.split('-').reverse().join('/')}`);
    expect(resumo).toMatch(/Alunos presentes: \d+/);
    expect(resumo).toContain('Ausentes: Breno Silva');

    await page.click('#btnCopiarResumoChamada');
    await expect(page.locator('#chamadaResumoStatus')).toHaveText('Copiado!');
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(resumo);
  });

  // Não mostra mais a grade completa (todo mundo, o tempo todo) — só um
  // alerta com quem está com frequência abaixo de 75% NESTE MÊS.
  test('relatório de presença mostra só quem está abaixo de 75% de frequência neste mês', async ({ page }) => {
    await openGestao(page, JOGOS_URL, {
      attendance: [
        // Breno: 1 presença de 4 dias este mês = 25% — abaixo de 75%, deve aparecer.
        { turma: 'jogos', data: `${thisMonth}-01`, student_email: 'breno.silva80', presente: true },
        { turma: 'jogos', data: `${thisMonth}-02`, student_email: 'breno.silva80', presente: false },
        { turma: 'jogos', data: `${thisMonth}-03`, student_email: 'breno.silva80', presente: false },
        { turma: 'jogos', data: `${thisMonth}-04`, student_email: 'breno.silva80', presente: false },
        // Edward: 4 presenças de 4 dias este mês = 100% — não deve aparecer na lista.
        { turma: 'jogos', data: `${thisMonth}-01`, student_email: 'edward.guzman', presente: true },
        { turma: 'jogos', data: `${thisMonth}-02`, student_email: 'edward.guzman', presente: true },
        { turma: 'jogos', data: `${thisMonth}-03`, student_email: 'edward.guzman', presente: true },
        { turma: 'jogos', data: `${thisMonth}-04`, student_email: 'edward.guzman', presente: true },
        // Falta de um mês antigo — não conta pro relatório do mês atual.
        { turma: 'jogos', data: '2000-01-01', student_email: 'iago.moreira', presente: false },
      ],
    });
    await expandGestaoSection(page, 'Relatórios');

    const row = page.locator('#presencaBody tr', { hasText: 'Breno Silva' });
    const cells = row.locator('td');
    await expect(cells.nth(1)).toHaveText('3'); // faltas no mês
    await expect(cells.nth(2)).toContainText('25%');

    await expect(page.locator('#presencaBody')).not.toContainText('Edward Guzman'); // 100% não entra na lista
    await expect(page.locator('#presencaBody')).not.toContainText('Iago Moreira'); // sem chamada este mês, não entra
  });

  test('sem ninguém abaixo de 75% este mês, mostra mensagem de que não há alunos', async ({ page }) => {
    await openGestao(page, JOGOS_URL, {
      attendance: [{ turma: 'jogos', data: `${thisMonth}-01`, student_email: 'breno.silva80', presente: true }],
    });
    await expandGestaoSection(page, 'Relatórios');

    await expect(page.locator('#presencaBody')).toContainText('Nenhum aluno com frequência abaixo de 75%');
  });

  test('PDF do mês abre uma aba com a tabela aluno×dia do mês selecionado e aciona a impressão', async ({ page }) => {
    await openGestao(page, JOGOS_URL, {
      attendance: [
        { turma: 'jogos', data: '2026-03-02', student_email: 'breno.silva80', presente: true },
        { turma: 'jogos', data: '2026-03-03', student_email: 'breno.silva80', presente: false },
        // Fora do mês selecionado — não pode aparecer na tabela nem entrar no % do mês.
        { turma: 'jogos', data: '2026-04-01', student_email: 'breno.silva80', presente: false },
      ],
    });
    await expandGestaoSection(page, 'Relatórios');

    await page.fill('#presencaPdfMes', '2026-03');

    // Registra o stub de window.print() no contexto ANTES de abrir a aba —
    // roda na carga inicial (about:blank) da aba nova e sobrevive ao
    // document.write() que monta a tabela em seguida (mesmo objeto window).
    await page.context().addInitScript(() => { window.print = () => { window.__printed = true; }; });

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('#btnGerarPdfPresenca'),
    ]);

    // window.open() abre a aba em branco antes da consulta ao Supabase
    // terminar — o document.write() com a tabela só chega depois, então
    // espera o <h1> aparecer em vez de "carregou" (que já vale pro blank).
    await expect(popup.locator('h1')).toContainText('março de 2026');
    await expect(popup.locator('table thead th')).toHaveCount(31 + 2); // Aluno + 31 dias de março + % Presença

    const row = popup.locator('table tbody tr', { hasText: 'Breno Silva' });
    await expect(row.locator('td.presente')).toHaveText('P');
    await expect(row.locator('td.falta')).toHaveText('F');
    await expect(row.locator('td.pct')).toHaveText('50%'); // 1 presença de 2 dias com chamada em março

    // print() só é chamado depois de um pequeno delay (deixa o layout
    // assentar antes de abrir o diálogo de impressão).
    await expect.poll(() => popup.evaluate(() => window.__printed)).toBe(true);
  });
});

test.describe('Notas — dentro do portal da turma', () => {
  // "Prova" (nota2) não é digitada — vem da nota da prova diagnóstica
  // (0-100, salva em student_activity_state ao concluir), escalada pra
  // 0-10, só quando a trilha "prova-diagnostica" está atribuída a ESTE
  // bimestre (trilha_bimestre, "Liberação por Trilha"). Não existe mais
  // uma "Média" única — cada MATÉRIA tem sua própria nota: média de
  // (% de conclusão só das trilhas DAQUELA matéria neste bimestre,
  // escalada até 5,0) + Prova + Nota 3 + Nota 4. "Projeto de Vida" é a
  // matéria dona de "vida-autoconhecimento"/"vida-cidadania" (turma
  // Jogos) — sua coluna é sempre a primeira (materiasParaNotas segue a
  // ordem de cfg.materias, e "Prova" é excluída da lista).
  test('cada matéria tem sua própria nota (% da matéria + Prova + Nota 3 + Nota 4), e recalcula ao vivo com Nota 3/4', async ({ page }) => {
    await openGestao(page, JOGOS_URL, {
      grades: [],
      trilha_bimestre: [
        { turma: 'jogos', trilha_key: 'vida-autoconhecimento', bimestre: 1 },
        { turma: 'jogos', trilha_key: 'prova-diagnostica', bimestre: 1 },
      ],
      student_module_progress: [
        { student_email: 'breno.silva80', turma: 'jogos', trilha_key: 'vida-autoconhecimento', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true },
        // prática só com 3 dos 5 pareceres — teoria 100% + prática 60% = 80% de conclusão da trilha.
        { student_email: 'breno.silva80', turma: 'jogos', trilha_key: 'vida-autoconhecimento', module_key: 'pratica', progress_current: 3, progress_total: 5 },
      ],
      student_activity_state: [
        { student_email: 'breno.silva80', progress_key: 'prova_jogos', state: { completed: true, correctCount: 16, total: 20, nota: 80 } },
      ],
    });
    await expandGestaoSection(page, 'Chamada e Notas');

    await expect(page.locator('#notasHead')).toContainText('Projeto de Vida');
    await expect(page.locator('#notasHead')).not.toContainText('Portal');
    await expect(page.locator('#notasHead')).not.toContainText('Média');

    const row = page.locator('#notasBody tr[data-email="breno.silva80"]');
    // Nota da prova 80/100 * 10 pontos = 8,00 — prova-diagnostica está no 1º Bimestre, igual o selecionado.
    await expect(row.locator('.prova-cell')).toContainText('8.00');

    await row.locator('[data-campo="nota3"]').fill('6');
    await row.locator('[data-campo="nota4"]').fill('4');

    // Projeto de Vida: (80%*5=4,00 + 8 + 6 + 4) / 4 = 5.50.
    const materiaCell = row.locator('.materia-grade-cell').first();
    await expect(materiaCell).toContainText('5.50');

    await page.click('#btnSalvarNotas');
    await expect(page.locator('#notasStatus')).toContainText('Notas salvas');

    // nota1 continua sendo salva por baixo dos panos (não aparece mais
    // como coluna própria) só pra grades.media não regredir.
    const saved = await page.evaluate(() =>
      (window.__FAKE_DB__.grades || []).find(r => r.student_email === 'breno.silva80' && r.bimestre === 1)
    );
    expect(saved).toMatchObject({ nota1: 4, nota2: 8, nota3: 6, nota4: 4, turma: 'jogos' });
  });

  test('sem trilha da matéria atribuída ao bimestre, a nota da matéria mostra "sem trilha"; prova de outro bimestre (ou sem bimestre) não conta em "Prova"', async ({ page }) => {
    await openGestao(page, JOGOS_URL, {
      grades: [], trilha_bimestre: [],
      student_module_progress: [
        { student_email: 'breno.silva80', turma: 'jogos', trilha_key: 'vida-autoconhecimento', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true },
      ],
      // Fez a prova, mas a trilha "prova-diagnostica" não tem bimestre
      // atribuído (trilha_bimestre vazio) — não conta em NENHUM bimestre.
      student_activity_state: [
        { student_email: 'breno.silva80', progress_key: 'prova_jogos', state: { completed: true, correctCount: 20, total: 20, nota: 100 } },
      ],
    });
    await expandGestaoSection(page, 'Chamada e Notas');

    const row = page.locator('#notasBody tr[data-email="breno.silva80"]');
    await expect(row.locator('.prova-cell')).toContainText('0.00');
    await expect(row.locator('.prova-cell')).toContainText('prova não é deste bimestre');

    const materiaCell = row.locator('.materia-grade-cell').first(); // Projeto de Vida
    await expect(materiaCell).toContainText('0.00');
    await expect(materiaCell).toContainText('sem trilha');
  });

  test('trocar de bimestre recalcula a nota de cada matéria E "Prova" — as duas só contam no bimestre a que a trilha foi atribuída', async ({ page }) => {
    await openGestao(page, JOGOS_URL, {
      grades: [],
      trilha_bimestre: [
        { turma: 'jogos', trilha_key: 'vida-autoconhecimento', bimestre: 1 },
        { turma: 'jogos', trilha_key: 'prova-diagnostica', bimestre: 1 },
        { turma: 'jogos', trilha_key: 'vida-cidadania', bimestre: 2 },
      ],
      student_module_progress: [
        { student_email: 'breno.silva80', turma: 'jogos', trilha_key: 'vida-autoconhecimento', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true },
        { student_email: 'breno.silva80', turma: 'jogos', trilha_key: 'vida-autoconhecimento', module_key: 'pratica', progress_current: 5, progress_total: 5, completed: true },
        { student_email: 'breno.silva80', turma: 'jogos', trilha_key: 'vida-cidadania', module_key: 'teoria', progress_current: 0, progress_total: 1 },
      ],
      student_activity_state: [
        { student_email: 'breno.silva80', progress_key: 'prova_jogos', state: { completed: true, correctCount: 20, total: 20, nota: 100 } },
      ],
    });
    await expandGestaoSection(page, 'Chamada e Notas');

    const row = page.locator('#notasBody tr[data-email="breno.silva80"]');
    const materiaCell = row.locator('.materia-grade-cell').first(); // Projeto de Vida (dona das duas trilhas)

    await expect(row.locator('.prova-cell')).toContainText('10.00'); // 100/100 * 10
    // 1º Bimestre: só vida-autoconhecimento conta (100%) — (5,00 + 10 + 0 + 0) / 4 = 3.75.
    await expect(materiaCell).toContainText('3.75');

    await page.selectOption('#notasBimestre', '2');
    // Prova é do 1º Bimestre — não conta mais aqui.
    await expect(row.locator('.prova-cell')).toContainText('0.00');
    await expect(row.locator('.prova-cell')).toContainText('prova não é deste bimestre');
    // 2º Bimestre: só vida-cidadania conta (0%) — (0 + 0 + 0 + 0) / 4 = 0.00.
    await expect(materiaCell).toContainText('0.00');
  });

  test('relatório de notas mostra só médias e o % de conclusão por matéria', async ({ page }) => {
    await openGestao(page, SISTEMAS_URL, {
      grades: [
        { student_email: 'alexandre.natal', student_name: 'Alexandre Natal', turma: 'sistemas', bimestre: 1, nota1: 10, nota2: 10, nota3: 10, nota4: 10, media: 10 },
        { student_email: 'alexandre.natal', student_name: 'Alexandre Natal', turma: 'sistemas', bimestre: 2, nota1: 8, nota2: 8, nota3: 8, nota4: 8, media: 8 },
      ],
      student_module_progress: [
        { student_email: 'alexandre.natal', turma: 'sistemas', trilha_key: 'sql', module_key: 'teoria', progress_current: 1, progress_total: 1, completed: true },
        { student_email: 'alexandre.natal', turma: 'sistemas', trilha_key: 'sql', module_key: 'basico', progress_current: 8, progress_total: 8, completed: true },
        { student_email: 'alexandre.natal', turma: 'sistemas', trilha_key: 'sql', module_key: 'join', progress_current: 5, progress_total: 5, completed: true },
        // "agregacao" (trilha sql) e "teoria" (trilha sql-comentarios) nunca
        // abertos — sem linha, contam como 0% na média da MATÉRIA Banco de
        // Dados (que soma os módulos das 2 trilhas dela).
      ],
      // "Nota da Prova" não vem de student_module_progress (que só sabe
      // "concluiu ou não" pro módulo progressMode:'flag' da prova) — vem
      // de student_activity_state, onde a prova salva `state.nota` (0-100)
      // ao concluir. progress_key segue `prova_<turma>` (ver finishExam()
      // em turmas/sistemas/atividades/prova-sistemas.html).
      student_activity_state: [
        { student_email: 'alexandre.natal', progress_key: 'prova_sistemas', state: { completed: true, correctCount: 17, total: 20, nota: 85 } },
      ],
    });
    await expandGestaoSection(page, 'Relatórios');

    // Só a média aparece no relatório — nunca os 4 campos de nota.
    await expect(page.locator('#relatorioNotasBody')).not.toContainText('nota1');
    // A coluna é por MATÉRIA, não por trilha.
    await expect(page.locator('#relatorioNotasHead')).toContainText('Banco de Dados');
    await expect(page.locator('#relatorioNotasHead')).toContainText('Nota da Prova');

    const row = page.locator('#relatorioNotasBody tr', { hasText: 'Alexandre Natal' });
    await expect(row).toContainText('10.00'); // média B1
    await expect(row).toContainText('8.00');  // média B2
    await expect(row).toContainText('9.00');  // média geral (10 e 8, sem B3/B4)
    await expect(row).toContainText('85/100'); // nota da prova, em pontos — nunca em %
    // Banco de Dados tem 6 módulos ao todo (sql: teoria/basico/join/agregacao +
    // sql-comentarios: teoria + db-conexao-supabase: pratica).
    // 3 concluídos, 3 nunca abertos => 3/6 = 50%.
    await expect(row).toContainText('50%');
  });

  test('relatório de notas mostra "—" pra quem ainda não fez a prova', async ({ page }) => {
    await openGestao(page, SISTEMAS_URL, { grades: [], student_module_progress: [], student_activity_state: [] });
    await expandGestaoSection(page, 'Relatórios');

    const row = page.locator('#relatorioNotasBody tr', { hasText: 'Alexandre Natal' });
    await expect(row).toContainText('—');
    await expect(row).not.toContainText('/100');
  });
});

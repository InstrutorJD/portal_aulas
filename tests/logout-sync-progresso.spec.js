// @ts-check
// Garantia adicionada a pedido do professor: progresso às vezes só ficava
// salvo na máquina do aluno, sem chegar no Supabase — o sintoma batia com
// um upsert best-effort ainda em voo (shared/progress-sync.js dentro do
// <iframe> do módulo, ou o próprio syncModuleProgress) sendo interrompido
// pela navegação do botão "Sair" pra index.html antes de terminar.
// shared/platform-core.js agora espera um syncAllModulesProgress() completo
// (com timeout de segurança) antes de navegar pra fora.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const SEED = {
  profiles: [
    { id: 'fake-alexandre.natal', email: 'alexandre.natal', nome: 'Alexandre Natal', role: 'aluno', turma: 'sistemas' },
  ],
};

test.describe('shared/platform-core.js — sincroniza progresso antes de sair', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('clicar em "Sair" sincroniza um progresso concluído que ainda não tinha ido pro Supabase', async ({ page }) => {
    // O Chromium desmonta o documento assim que window.location.href é
    // atribuído — bem antes da navegação de verdade terminar — então
    // qualquer page.evaluate() rodado DEPOIS do clique chega tarde demais
    // pra ler window.__FAKE_DB__. shared/platform-core.js chama (só se
    // existir) window.__testAfterLogoutSync() logo após aguardar o sync e
    // ANTES de navegar — expondo essa função aqui, o snapshot do banco
    // fake é lido do lado do Node (sobrevive à troca de documento) no
    // exato instante em que ainda dá tempo.
    let snapshot = null;
    await page.exposeFunction('__testAfterLogoutSync', async () => {
      snapshot = await page.evaluate(() => (window.__FAKE_DB__.student_module_progress || []).find(r => r.trilha_key === 'sql' && r.module_key === 'teoria'));
    });
    // Não deixa a navegação de fato completar — só interessa o estado
    // capturado pelo gancho acima, antes de qualquer coisa trocar de documento.
    await page.route('**/index.html', () => new Promise(() => {}));

    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');

    // Espera a sincronização inicial (dispara no bootstrap) assentar —
    // ela já cria uma linha completed:false pra cada módulo cadastrado.
    await page.waitForFunction(() => {
      const rows = window.__FAKE_DB__.student_module_progress || [];
      return rows.some(r => r.trilha_key === 'sql' && r.module_key === 'teoria');
    });

    const antes = await page.evaluate(() => (window.__FAKE_DB__.student_module_progress || []).find(r => r.trilha_key === 'sql' && r.module_key === 'teoria'));
    expect(antes.completed).toBe(false);

    // Simula o aluno tendo concluído a teoria de SQL SEM que isso ainda
    // tenha chegado no Supabase (o cenário relatado: a escrita no
    // localStorage aconteceu, mas o upsert best-effort correspondente não
    // teve tempo de terminar).
    await page.evaluate(() => {
      localStorage.setItem('sql_basico_teoria_progress_alexandre.natal', JSON.stringify({ completed: true, lastStepIndex: 9, correctCount: 9 }));
    });

    // noWaitAfter: a rota de index.html interceptada acima nunca resolve
    // de propósito (ver comentário lá em cima) — sem isso o próprio
    // page.click() travaria esperando essa navegação assentar.
    await page.click('#btnLogout', { noWaitAfter: true });

    await expect.poll(() => snapshot && snapshot.completed, { message: 'window.__testAfterLogoutSync nunca rodou ou o progresso continuou completed:false' }).toBe(true);
  });

  test('o botão "Sair" volta ao normal (reabilitado, texto original) antes de navegar', async ({ page }) => {
    // Mesmo problema do teste acima: a navegação real destrói o documento
    // rápido demais pra um expect() polling pegar o estado do botão de
    // forma confiável — usa o mesmo gancho pra capturar o estado do lado
    // do Node, no instante exato em que o código já reabilitou o botão
    // mas ainda não navegou.
    let estadoBotao = null;
    await page.exposeFunction('__testAfterLogoutSync', async () => {
      estadoBotao = await page.evaluate(() => {
        const btn = document.getElementById('btnLogout');
        return { texto: btn.textContent, desabilitado: btn.disabled };
      });
    });
    await page.route('**/index.html', () => new Promise(() => {}));

    await page.goto('/turmas/sistemas/plataforma.html?user=alexandre.natal&ip=192.168.2.1&saldo=1183.50&role=aluno');
    await page.waitForFunction(() => (window.__FAKE_DB__.student_module_progress || []).length > 0);

    await page.click('#btnLogout', { noWaitAfter: true });

    await expect.poll(() => estadoBotao, { message: 'window.__testAfterLogoutSync nunca rodou' }).not.toBeNull();
    expect(estadoBotao.texto).toBe('Sair');
    expect(estadoBotao.desabilitado).toBe(false);
  });
});

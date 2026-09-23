// @ts-check
// "Prova Final (Engel)" — trilha individual, visível só pro Engel (matéria
// Prova, turma Jogos Digitais). Diferente da Prova Final da turma toda
// (prova-final-jogos.html: banco de 80, teoria+prática, cobre todas as
// matérias), essa é PURAMENTE de raciocínio lógico — a maioria é completar
// uma sequência de 3 palavras (mesma letra, categoria, rima ou ordem), mas
// também tem desafios de relacionar cores, de posição de objetos, de
// variáveis (a caixa 📦 guarda um valor) e de constante (o cofre 🔒 trava
// o valor pra sempre) — sem código nenhum, só metáfora visual —, 3
// alternativas cada — mesmo motor/trava de integridade (shared/
// exam-proctor.js) de prova-jogos-engel.html.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, gerarGabaritoFlutuante } = require('./helpers');

const PROVA_URL = '/turmas/jogos/atividades/prova-final-engel.html?user=engel.fraga&role=aluno&turma=jogos';

const TOKEN_VALIDO = '482913';
const SEED = {
  profiles: [
    { id: 'fake-engel.fraga', email: 'engel.fraga', nome: 'Engel Fraga', role: 'aluno', turma: 'jogos' },
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
  professor_tokens: [
    { token: TOKEN_VALIDO, created_by: 'fake-admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  ],
};

/** Mesma técnica de tests/prova-jogos.spec.js: document.hidden é só-leitura,
 * então redefine a propriedade antes de disparar o evento que
 * shared/exam-proctor.js escuta. */
async function simulateTabHidden(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    // Volta pra aba logo em seguida — shared/exam-proctor.js só conta uma
    // nova saída depois que o aluno voltou pro portal.
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

// Abre a prova e já clica "Começar" (trava de tela armada) — a maioria dos
// testes quer chegar direto na 1ª sequência, não na tela de regras em si
// (essa tem teste próprio).
async function openProva(page) {
  await stubSupabaseFake(page, SEED);
  await page.goto(PROVA_URL);
  await page.click('#btnIniciar');
}

test.describe('turmas/jogos/atividades/prova-final-engel.html', () => {
  test('mostra a tela de regras antes de começar, não a prova direto', async ({ page }) => {
    await stubSupabaseFake(page, SEED);
    await page.goto(PROVA_URL);
    await expect(page.locator('#gateWrap')).toContainText('Antes de começar');
    await expect(page.locator('#stageWrap')).toBeHidden();
  });

  test('depois de "Começar", mostra o 1º desafio, com os 27 desafios + resultado no total', async ({ page }) => {
    await openProva(page);
    await expect(page.locator('.bloco-label')).toContainText('Desafio 1 de 27');
    const total = await page.evaluate(() => QUESTIONS.length);
    expect(total).toBe(27);
    await expect(page.locator('#lblStepTotal')).toHaveText('28');
  });

  test('cada desafio vem com exatamente 3 alternativas', async ({ page }) => {
    await openProva(page);
    await expect(page.locator('.option')).toHaveCount(3);
    await expect(page.locator('.opt-letter').nth(2)).toHaveText('C');
  });

  test('cada desafio tem uma única resposta certa entre as opções', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/atividades/prova-final-engel.html?user=admin&role=professor&turma=jogos');
    const questions = await page.evaluate(() => QUESTIONS);
    for (const q of questions) {
      const matches = q.options.filter(o => o === q.options[q.certa]);
      expect(matches, `opção certa duplicada em "${q.lead}"`).toHaveLength(1);
      expect(new Set(q.options).size, `opções repetidas em "${q.lead}"`).toBe(3);
    }
  });

  test('a resposta certa não fica sempre na mesma letra (senão "sempre clicar em A" vira um atalho)', async ({ page }) => {
    // Regressão: os 10 primeiros desafios nasceram todos com certa=0.
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/atividades/prova-final-engel.html?user=admin&role=professor&turma=jogos');
    const certas = await page.evaluate(() => QUESTIONS.map(q => q.certa));
    expect(new Set(certas).size, 'todas as respostas certas caem na mesma letra').toBeGreaterThan(1);
    // nenhuma letra deve concentrar mais da metade das respostas certas
    const porLetra = [0, 0, 0];
    certas.forEach(c => porLetra[c]++);
    porLetra.forEach(count => expect(count).toBeLessThanOrEqual(Math.ceil(certas.length / 2)));
  });

  test('inclui desafios de cor, de posição de objetos, de variáveis e de constante, além das sequências de palavras', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/atividades/prova-final-engel.html?user=admin&role=professor&turma=jogos');
    const blocos = await page.evaluate(() => QUESTIONS.map(q => q.bloco));
    expect(blocos.filter(b => b === 'Relacionar cores').length).toBeGreaterThanOrEqual(2);
    expect(blocos.filter(b => b.startsWith('Posição de objetos')).length).toBeGreaterThanOrEqual(2);
    expect(blocos.filter(b => b.startsWith('Variáveis')).length).toBeGreaterThanOrEqual(5);
    expect(blocos.filter(b => b.startsWith('Constantes')).length).toBeGreaterThanOrEqual(1);
  });

  test('o desafio de constante usa o cofre 🔒 e contrasta com a variável (valor NÃO é substituído)', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/atividades/prova-final-engel.html?user=admin&role=professor&turma=jogos');
    const constante = await page.evaluate(() => QUESTIONS.find(q => q.bloco.startsWith('Constantes')));
    expect(constante).toBeTruthy();
    expect(constante.lead).toContain('🔒');
    expect(constante.lead).not.toMatch(/[=;{}()]/);
    // ao contrário do item de variável equivalente (o valor NOVO vence),
    // na constante o valor ORIGINAL é que continua valendo.
    expect(constante.options[constante.certa]).toBe('🍎');
  });

  test('desafios de variáveis usam a caixa 📦 como metáfora, sem código nenhum no enunciado', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/atividades/prova-final-engel.html?user=admin&role=professor&turma=jogos');
    const variaveis = await page.evaluate(() => QUESTIONS.filter(q => q.bloco.startsWith('Variáveis')));
    expect(variaveis.length).toBe(5);
    for (const q of variaveis) {
      expect(q.lead, `enunciado sem 📦: "${q.lead}"`).toContain('📦');
      expect(q.lead, `enunciado parece código de verdade: "${q.lead}"`).not.toMatch(/[=;{}()]/);
    }
    // o item de "trocar os valores" (swap) é o mais difícil do bloco.
    const swap = variaveis.find(q => q.bloco.includes('trocar'));
    expect(swap).toBeTruthy();
    expect(swap.options[swap.certa]).toBe('🍌');
  });

  test('responder certo mostra feedback de acerto com a regra, e responder errado mostra a resposta certa', async ({ page }) => {
    await openProva(page);

    const correctIdx = await page.evaluate(() => QUESTIONS[0].certa);
    const wrongIdx = correctIdx === 0 ? 1 : 0;

    await page.locator('.option').nth(wrongIdx).click();
    await expect(page.locator('.feedback.incorrect')).toContainText('Quase!');
    await expect(page.locator('.feedback.incorrect')).toContainText('Regra:');
    await expect(page.locator('.option').nth(correctIdx)).toHaveClass(/correct/);
  });

  test('responde os 27 desafios e conclui, mostrando o placar', async ({ page }) => {
    await openProva(page);

    const total = await page.evaluate(() => QUESTIONS.length);
    for (let i = 0; i < total; i++) {
      const correctIdx = await page.evaluate(i => QUESTIONS[i].certa, i);
      await page.locator('.option').nth(correctIdx).click();
      await page.click('#btnNext');
    }

    await expect(page.locator('.score-box h2')).toContainText('Você terminou!');
    await expect(page.locator('.score')).toContainText('27/27');

    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`prova_final_jogos_engel_progress_${u}`)), 'engel.fraga');
    expect(progress).toMatchObject({ completed: true, correctCount: 27 });
  });

  test('recarregar a página no meio da prova não reabre um desafio já respondido', async ({ page }) => {
    await openProva(page);
    const correctIdx0 = await page.evaluate(() => QUESTIONS[0].certa);
    await page.locator('.option').nth(correctIdx0).click();
    await page.click('#btnNext');

    await expect(page.locator('.bloco-label')).toContainText('Desafio 2 de 27');

    await page.reload();
    await expect(page.locator('.bloco-label')).toContainText('Desafio 2 de 27');
  });

  test('gabarito lista os 27 desafios com a regra e a resposta certa pra cada um', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/atividades/prova-final-engel.html?user=admin&role=professor&turma=jogos');

    const download = await gerarGabaritoFlutuante(page);
    expect(download.suggestedFilename()).toBe('prova-final-engel-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('Bicicleta, Borboleta, Bola');
    expect(content).toContain('Regra:');
  });
});

test.describe('turmas/jogos/atividades/prova-final-engel.html — trava de tela', () => {
  test('1ª saída da aba avisa, 2ª bloqueia — e o professor desbloqueia com o token', async ({ page }) => {
    await openProva(page);

    // 1ª saída: aviso, a prova continua acessível por baixo do overlay.
    await simulateTabHidden(page);
    await expect(page.locator('.warn-overlay')).toContainText('Aviso 1/2');
    await page.click('#btnWarnOk');
    await expect(page.locator('.warn-overlay')).toHaveCount(0);
    await expect(page.locator('#stageWrap')).toBeVisible();

    // 2ª saída: bloqueia de verdade — a prova some, entra a tela de bloqueio.
    await simulateTabHidden(page);
    await expect(page.locator('#gateWrap')).toContainText('Prova bloqueada');
    await expect(page.locator('#stageWrap')).toBeHidden();

    const blockedState = await page.evaluate(u => JSON.parse(localStorage.getItem(`prova_final_jogos_engel_guard_${u}`)), 'engel.fraga');
    expect(blockedState.blocked).toBe(true);

    // Sem o token do professor não sai da tela de bloqueio.
    await page.fill('#unlockToken', '000000');
    await page.click('#btnUnlock');
    await expect(page.locator('#gateWrap')).toContainText('Prova bloqueada');

    // Com o token certo, volta pra tela de regras (não direto pra prova) e zera os avisos.
    await page.fill('#unlockToken', TOKEN_VALIDO);
    await page.click('#btnUnlock');
    await expect(page.locator('#gateWrap')).toContainText('Antes de começar');
    const unlockedState = await page.evaluate(u => JSON.parse(localStorage.getItem(`prova_final_jogos_engel_guard_${u}`)), 'engel.fraga');
    expect(unlockedState.blocked).toBe(false);
    expect(unlockedState.warnings).toBe(0);
  });

  test('depois de responder os 27 desafios, a prova abre direto no placar (sem tela de regras) e sair da aba não conta mais aviso', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.addInitScript(u => {
      const respostas = new Array(27).fill(true);
      localStorage.setItem(`prova_final_jogos_engel_progress_${u}`, JSON.stringify({ respostas, completed: true, correctCount: 27 }));
    }, 'engel.fraga');

    await page.goto(PROVA_URL);
    await expect(page.locator('.score-box h2')).toContainText('Você terminou!');

    await simulateTabHidden(page);
    await expect(page.locator('.warn-overlay')).toHaveCount(0);
  });

  test('professor abre a prova direto, sem tela de regras nem risco de bloqueio', async ({ page }) => {
    await stubSupabaseFake(page, {
      profiles: [{ id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' }],
    });
    await page.goto('/turmas/jogos/atividades/prova-final-engel.html?user=admin&role=professor&turma=jogos');
    await expect(page.locator('.bloco-label')).toContainText('Desafio 1 de 27');
    await expect(page.locator('#btnSkipProfessor')).toBeVisible();
  });
});

test.describe('turmas/jogos/plataforma.html — Prova Final (Engel)', () => {
  test('engel.fraga vê a própria prova final adaptada dentro da matéria Prova', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/plataforma.html?user=engel.fraga&ip=192.168.1.20&saldo=1000.00&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Prova")');
    await expect(page.locator('#trilhaSelect option[value="prova-final-engel"]')).toHaveCount(1);

    await page.selectOption('#trilhaSelect', 'prova-final-engel');
    await expect(page.locator('#subTabContent_prova-final-engel')).toBeVisible();
    await page.click('#moduleSelector_prova-final-engel .game-card');
    await expect(page.locator('#moduleFrame_prova-final-engel')).toHaveAttribute(
      'src', /atividades\/prova-final-engel\.html\?user=engel\.fraga/
    );
  });

  test('outro aluno (fora da lista) não vê a prova final adaptada do Engel', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos');
    await page.click('.game-card:has-text("Prova")');
    await expect(page.locator('#trilhaSelect option[value="prova-final-engel"]')).toHaveCount(0);
  });

  test('professor sempre vê a prova final adaptada do Engel, mesmo não estando na lista de visibleFor', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos');
    await page.click('.game-card:has-text("Prova")');
    await expect(page.locator('#trilhaSelect option[value="prova-final-engel"]')).toHaveCount(1);
  });
});

// @ts-check
// Trilha "Projeto: Construa seu Jogo" (Codificação de Jogos, turma Jogos
// Digitais) — jogo de Cobrinha construído peça por peça dentro do próprio
// portal. Cada desafio testa uma função de lógica isolada (sem múltipla
// escolha); ao passar, a função entra ao vivo no motor do jogo (canvas
// sempre visível). Termina com escolha de visual/som e visto do professor,
// autorizado por um TOKEN temporário (shared/professor-visto.js) — não
// mais a credencial real do professor.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const URL = '/turmas/jogos/atividades/cobrinha-construcao.html?user=smoketest';

const TOKEN_VALIDO = '482913';

const SEED = {
  profiles: [
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
  professor_tokens: [
    { token: TOKEN_VALIDO, created_by: 'fake-admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  ],
};

const SAMPLE_CODE = {
  criarCobrinha: 'function criarCobrinha() { return [{x:7,y:7},{x:6,y:7},{x:5,y:7}]; }',
  teclaParaDirecao: `function teclaParaDirecao(tecla) {
    if (tecla === 'ArrowUp') return {dx:0,dy:-1};
    if (tecla === 'ArrowDown') return {dx:0,dy:1};
    if (tecla === 'ArrowLeft') return {dx:-1,dy:0};
    if (tecla === 'ArrowRight') return {dx:1,dy:0};
    return null;
  }`,
  proximaPosicao: 'function proximaPosicao(cabeca, direcao) { return {x: cabeca.x+direcao.dx, y: cabeca.y+direcao.dy}; }',
  mover: 'function mover(cobrinha, novaCabeca, cresce) { return cresce ? [novaCabeca, ...cobrinha] : [novaCabeca, ...cobrinha.slice(0,-1)]; }',
  gerarComida: 'function gerarComida(colunas, linhas, sorteio) { return {x: sorteio(0,colunas-1), y: sorteio(0,linhas-1)}; }',
  comeuComida: 'function comeuComida(cabeca, comida) { return cabeca.x===comida.x && cabeca.y===comida.y; }',
  atualizarPontuacao: 'function atualizarPontuacao(pontuacaoAtual, comeu) { return comeu ? pontuacaoAtual+1 : pontuacaoAtual; }',
  bateuNaParede: 'function bateuNaParede(posicao, colunas, linhas) { return posicao.x<0||posicao.x>=colunas||posicao.y<0||posicao.y>=linhas; }',
  bateuNoProprioCorpo: 'function bateuNoProprioCorpo(novaCabeca, cobrinha) { return cobrinha.some(s => s.x===novaCabeca.x && s.y===novaCabeca.y); }',
  jogoAcabou: 'function jogoAcabou(bateuParede, bateuCorpo) { return bateuParede || bateuCorpo; }',
};

const FN_NAMES = ['criarCobrinha','teclaParaDirecao','proximaPosicao','mover','gerarComida','comeuComida','atualizarPontuacao','bateuNaParede','bateuNoProprioCorpo','jogoAcabou'];

test.describe('turmas/jogos/atividades/cobrinha-construcao.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('código errado não libera o próximo passo, e o console não revela a resposta', async ({ page }) => {
    await page.goto(URL);

    await expect(page.locator('.card h2')).toContainText('Sua missão');
    await page.click('#btnContinuar');
    await expect(page.locator('.card h2')).toContainText('Como funciona');
    await page.click('#btnContinuar');
    await expect(page.locator('.card h2')).toContainText('Criar o personagem');
    await page.click('#btnContinuar');

    await expect(page.locator('#codeInput')).toBeVisible();

    // A dica pode ter código de exemplo, mas nunca a resposta literal do
    // desafio (README, seção "Dicas") — aqui confere que o bloco de código
    // aparece (ajuda de verdade) sem usar o nome da função do desafio.
    await page.click('#btnHint');
    await expect(page.locator('.hint-box pre code')).toBeVisible();
    await expect(page.locator('.hint-box')).not.toContainText('criarCobrinha');

    await page.fill('#codeInput', 'function criarCobrinha() { return []; }');
    await page.click('#btnRun');
    await expect(page.locator('.console')).toContainText('Ainda não');
    await expect(page.locator('#btnNext')).toHaveCount(0);

    // Erro clássico de iniciante: esquecer o return. A mensagem precisa
    // apontar isso, não só "esperado X, recebeu undefined".
    await page.fill('#codeInput', 'function criarCobrinha() { const x = [{x:7,y:7},{x:6,y:7},{x:5,y:7}]; }');
    await page.click('#btnRun');
    await expect(page.locator('.console')).toContainText('você usou o return?');

    // Corrige e agora sim libera o próximo passo, sem perder a mensagem de sucesso.
    await page.fill('#codeInput', SAMPLE_CODE.criarCobrinha);
    await page.click('#btnRun');
    await expect(page.locator('.console')).toContainText('Tudo certo');
    await expect(page.locator('#btnNext')).toBeVisible();
  });

  test('resolve os 10 desafios, escolhe visual/som e chega no visto do professor', async ({ page }) => {
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

    await page.goto(URL);

    // Tela de intro ("Sua missão") -> Continuar
    await expect(page.locator('.card h2')).toContainText('Sua missão');
    await page.click('#btnContinuar');
    // Tela "Como funciona um desafio" -> Continuar, antes do 1º par explicação/desafio
    await expect(page.locator('.card h2')).toContainText('Como funciona');
    await page.click('#btnContinuar');

    for (const fnName of FN_NAMES) {
      // tela de explicação -> Continuar
      await page.click('#btnContinuar');
      // tela de desafio
      await expect(page.locator('#codeInput')).toBeVisible();
      await page.fill('#codeInput', SAMPLE_CODE[fnName]);
      await page.click('#btnRun');
      await expect(page.locator('.console')).toContainText('Tudo certo', { timeout: 5000 });
      await page.click('#btnNext');
    }

    // Escolha visual
    await page.click('#btnContinuar');
    await expect(page.locator('.escolha-grid')).toBeVisible();
    await page.click('.escolha-opt:has-text("Neon")');
    await expect(page.locator('.escolha-opt.selected')).toContainText('Neon');
    await page.click('#btnNextEscolha');

    // Escolha som
    await page.click('#btnContinuar');
    await expect(page.locator('.escolha-grid')).toBeVisible();
    await page.click('.escolha-opt:has-text("Suave")');
    await page.click('#btnNextEscolha');

    // Tela de visto
    await expect(page.locator('#vistoToken')).toBeVisible();
    await page.fill('#vistoToken', TOKEN_VALIDO);
    await page.click('#btnDarVisto');
    await expect(page.locator('.visto-box')).toContainText('Jogo entregue', { timeout: 5000 });

    expect(consoleErrors, 'não deveria haver erros de JS: ' + consoleErrors.join(' | ')).toEqual([]);
  });

  test('"Pular (professor)" exige token válido e libera a etapa mesmo sem código correto', async ({ page }) => {
    await page.goto(URL);

    await page.click('#btnContinuar'); // Sua missão
    await page.click('#btnContinuar'); // Como funciona
    await page.click('#btnContinuar'); // explicação do 1º desafio
    await expect(page.locator('#codeInput')).toBeVisible();

    // Sem resolver o desafio, tenta pular com token errado primeiro.
    await page.click('#btnSkipStep');
    await expect(page.locator('#skipForm')).toBeVisible();
    await page.fill('#skipToken', '000000');
    await page.click('#btnConfirmSkip');
    await expect(page.locator('#skipMsg')).toContainText('inválido ou expirado');
    await expect(page.locator('#btnNext')).toHaveCount(0);

    // Token correto pula a etapa sem o código passar no teste.
    await page.fill('#skipToken', TOKEN_VALIDO);
    await page.click('#btnConfirmSkip');
    await expect(page.locator('.console')).toContainText('pulada pelo professor');
    await expect(page.locator('#btnNext')).toBeVisible();

    // O jogo continua funcionando (usa a solução de referência por trás),
    // então o slot da função pulada foi ligado mesmo sem o código do aluno.
    const wired = await page.evaluate(() => typeof slots.criarCobrinha === 'function');
    expect(wired).toBe(true);

    // Avança e recarrega a página: a etapa pulada continua concluída, e o
    // jogo continua funcional a partir da solução de referência salva.
    await page.click('#btnNext');
    await page.reload();
    const stillWired = await page.evaluate(() => typeof slots.criarCobrinha === 'function');
    expect(stillWired).toBe(true);
  });
});

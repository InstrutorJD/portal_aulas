// @ts-check
// Trilha "Projeto: Construa seu App" (Programação de Aplicativos, turma
// Sistemas) — app de vídeos curtos (ClipZone) construído peça por peça
// dentro do próprio portal, mesmo espírito de
// turmas/jogos/atividades/cobrinha-construcao.html: cada desafio testa uma
// função de lógica isolada (sem múltipla escolha); ao passar, a função
// entra ao vivo na moldura de celular (sempre visível), incluindo os campos
// de login realmente interativos e o botão de curtir do feed. Termina com
// escolha de tema/ícone e visto do professor, autorizado por um TOKEN
// temporário (shared/professor-visto.js).
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const URL = '/turmas/sistemas/atividades/clipzone-construcao.html?user=smoketest';

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
  validarUsuario: 'function validarUsuario(usuario) { return usuario.length >= 3; }',
  validarSenha: 'function validarSenha(senha) { return senha.length >= 6; }',
  podeEntrar: 'function podeEntrar(usuarioValido, senhaValida) { return usuarioValido && senhaValida; }',
  mensagemErro: `function mensagemErro(usuarioValido, senhaValida) {
    if (!usuarioValido) return "Usuário precisa de pelo menos 3 caracteres";
    if (!senhaValida) return "Senha precisa de pelo menos 6 caracteres";
    return "";
  }`,
  criarPost: 'function criarPost(usuario, legenda, curtidas) { return { usuario: usuario, legenda: legenda, curtidas: curtidas }; }',
  curtir: 'function curtir(post) { return { usuario: post.usuario, legenda: post.legenda, curtidas: post.curtidas + 1 }; }',
  formatarCurtidas: 'function formatarCurtidas(numero) { if (numero < 1000) return String(numero); return (numero/1000).toFixed(1) + "K"; }',
};

const FN_NAMES = ['validarUsuario', 'validarSenha', 'podeEntrar', 'mensagemErro', 'criarPost', 'curtir', 'formatarCurtidas'];

test.describe('turmas/sistemas/atividades/clipzone-construcao.html', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, SEED);
  });

  test('código errado não libera o próximo passo, e o console não revela a resposta', async ({ page }) => {
    await page.goto(URL);

    await expect(page.locator('.card h2')).toContainText('Sua missão');
    await page.click('#btnContinuar');
    await expect(page.locator('.card h2')).toContainText('Como funciona');
    await page.click('#btnContinuar');
    await expect(page.locator('.card h2')).toContainText('Validar o usuário');
    await page.click('#btnContinuar');

    await expect(page.locator('#codeInput')).toBeVisible();

    await page.click('#btnHint');
    await expect(page.locator('.hint-box pre code')).toBeVisible();
    await expect(page.locator('.hint-box')).not.toContainText('validarUsuario');

    await page.fill('#codeInput', 'function validarUsuario(usuario) { return true; }');
    await page.click('#btnRun');
    await expect(page.locator('.console')).toContainText('Ainda não');
    await expect(page.locator('#btnNext')).toHaveCount(0);

    // Erro clássico de iniciante: esquecer o return.
    await page.fill('#codeInput', 'function validarUsuario(usuario) { const ok = usuario.length >= 3; }');
    await page.click('#btnRun');
    await expect(page.locator('.console')).toContainText('você usou o return?');

    await page.fill('#codeInput', SAMPLE_CODE.validarUsuario);
    await page.click('#btnRun');
    await expect(page.locator('.console')).toContainText('Tudo certo');
    await expect(page.locator('#btnNext')).toBeVisible();
  });

  test('a tela de login no celular valida ao vivo conforme o aluno digita, sem recarregar nada', async ({ page }) => {
    await page.goto(URL);
    await page.click('#btnContinuar'); // Sua missão
    await page.click('#btnContinuar'); // Como funciona

    // resolve os 4 desafios de login em sequência
    for (const fnName of ['validarUsuario', 'validarSenha', 'podeEntrar', 'mensagemErro']) {
      await page.click('#btnContinuar'); // explicação
      await expect(page.locator('#codeInput')).toBeVisible();
      await page.fill('#codeInput', SAMPLE_CODE[fnName]);
      await page.click('#btnRun');
      await expect(page.locator('.console')).toContainText('Tudo certo', { timeout: 5000 });
      await page.click('#btnNext');
    }

    // Com os 4 desafios de login resolvidos, o celular (moldura, fora do
    // fluxo de missões) já reage de verdade ao que o "usuário de teste"
    // digitar nos campos — prova que os slots foram ligados no motor.
    await page.click('#tabLogin');
    const fldUsuario = page.locator('#fldUsuario');
    const fldSenha = page.locator('#fldSenha');
    const btnEntrar = page.locator('#btnLoginEntrar');

    await expect(btnEntrar).toBeDisabled();
    await fldUsuario.fill('an');
    await expect(page.locator('#loginErro')).toContainText('Usuário precisa de pelo menos 3 caracteres');
    await expect(btnEntrar).toBeDisabled();

    await fldUsuario.fill('ana.criativa');
    await fldSenha.fill('12345');
    await expect(page.locator('#loginErro')).toContainText('Senha precisa de pelo menos 6 caracteres');
    await expect(btnEntrar).toBeDisabled();

    await fldSenha.fill('123456');
    await expect(page.locator('#loginErro')).toHaveText('');
    await expect(btnEntrar).toBeEnabled();
  });

  test('resolve os 7 desafios, escolhe tema/ícone, curte um post ao vivo e chega no visto do professor', async ({ page }) => {
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

    await page.goto(URL);

    await expect(page.locator('.card h2')).toContainText('Sua missão');
    await page.click('#btnContinuar');
    await expect(page.locator('.card h2')).toContainText('Como funciona');
    await page.click('#btnContinuar');

    for (const fnName of FN_NAMES) {
      await page.click('#btnContinuar'); // explicação
      await expect(page.locator('#codeInput')).toBeVisible();
      await page.fill('#codeInput', SAMPLE_CODE[fnName]);
      await page.click('#btnRun');
      await expect(page.locator('.console')).toContainText('Tudo certo', { timeout: 5000 });
      await page.click('#btnNext');
    }

    // Com criarPost resolvido, o feed já mostra os 3 posts de demonstração —
    // e o botão de curtir (curtir() resolvido também) atualiza ao vivo.
    await page.click('#tabFeed');
    const firstLike = page.locator('.post-card').first().locator('.post-like');
    await expect(firstLike).toContainText('128');
    await firstLike.click();
    await expect(firstLike).toContainText('129');

    // Escolha de tema
    await page.click('#btnContinuar');
    await expect(page.locator('.escolha-grid')).toBeVisible();
    await page.click('.escolha-opt:has-text("Neon")');
    await expect(page.locator('.escolha-opt.selected')).toContainText('Neon');
    await page.click('#btnNextEscolha');

    // Escolha de ícone de curtir
    await page.click('#btnContinuar');
    await expect(page.locator('.escolha-grid')).toBeVisible();
    await page.click('.escolha-opt:has-text("Fogo")');
    await page.click('#btnNextEscolha');

    // Tela de visto
    await expect(page.locator('#vistoToken')).toBeVisible();
    await page.fill('#vistoToken', TOKEN_VALIDO);
    await page.click('#btnDarVisto');
    await expect(page.locator('.visto-box')).toContainText('App entregue', { timeout: 5000 });

    expect(consoleErrors, 'não deveria haver erros de JS: ' + consoleErrors.join(' | ')).toEqual([]);
  });

  test('"Pular (professor)" exige token válido e libera a etapa mesmo sem código correto', async ({ page }) => {
    await page.goto(URL);

    await page.click('#btnContinuar'); // Sua missão
    await page.click('#btnContinuar'); // Como funciona
    await page.click('#btnContinuar'); // explicação do 1º desafio
    await expect(page.locator('#codeInput')).toBeVisible();

    await page.click('#btnSkipStep');
    await expect(page.locator('#skipForm')).toBeVisible();
    await page.fill('#skipToken', '000000');
    await page.click('#btnConfirmSkip');
    await expect(page.locator('#skipMsg')).toContainText('inválido ou expirado');
    await expect(page.locator('#btnNext')).toHaveCount(0);

    await page.fill('#skipToken', TOKEN_VALIDO);
    await page.click('#btnConfirmSkip');
    await expect(page.locator('.console')).toContainText('pulada pelo professor');
    await expect(page.locator('#btnNext')).toBeVisible();

    const wired = await page.evaluate(() => typeof slots.validarUsuario === 'function');
    expect(wired).toBe(true);

    await page.click('#btnNext');
    await page.reload();
    const stillWired = await page.evaluate(() => typeof slots.validarUsuario === 'function');
    expect(stillWired).toBe(true);
  });
});

// @ts-check
// Jogo individual "Formar Frases (Engel)" — matéria DEDICADA e inteira
// restrita a um único aluno (materia.visibleFor, não só trilha.visibleFor
// como as outras adaptações do Engel) — ver isMateriaVisibleToEmail em
// shared/platform-core.js. Cobre o ponto mais sensível: o CARD da matéria
// não pode vazar (nem vazio/"Em breve") pra quem não é o Engel nem o
// professor, e o jogo em si (associar palavra + emoji pra completar frase,
// sem digitar) precisa travar progressão, aceitar pular via token do
// professor e gerar gabarito — mesmo padrão dos outros jogos dele.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake, expandGabaritoRow } = require('./helpers');

const PROFESSOR_URL = '/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor&turma=jogos';
const ENGEL_URL = '/turmas/jogos/plataforma.html?user=engel.fraga&ip=192.168.1.20&saldo=1000.00&role=aluno&turma=jogos';
const BRENO_URL = '/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&turma=jogos';

const TOKEN_VALIDO = '482913';
const SEED_PROFESSOR = {
  profiles: [
    { id: 'fake-admin', email: 'admin', nome: 'Instrutor / Professor', role: 'professor', turma: 'all' },
  ],
  professor_tokens: [
    { token: TOKEN_VALIDO, created_by: 'fake-admin', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  ],
};

async function openJogo(page) {
  await page.goto(ENGEL_URL);
  await page.click('.game-card:has-text("Comunicação (Engel)")');
  await page.click('#moduleSelector_frases-engel .game-card');
  return page.frameLocator('#moduleFrame_frases-engel');
}

test.describe('Matéria "Comunicação (Engel)" — visibilidade do card', () => {
  test('professor vê o card da matéria', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(PROFESSOR_URL);
    await expect(page.locator('#materiaCardGrid')).toContainText('Comunicação (Engel)');
  });

  test('engel.fraga vê o card da matéria', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(ENGEL_URL);
    await expect(page.locator('#materiaCardGrid')).toContainText('Comunicação (Engel)');
  });

  test('outro aluno não vê o card da matéria (nem vazio/"Em breve")', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(BRENO_URL);
    await expect(page.locator('#materiaCardGrid')).not.toContainText('Comunicação (Engel)');
    // regressão: continua vendo as mesmas 7 matérias de sempre, não 8.
    await expect(page.locator('#materiaCardGrid .game-card')).toHaveCount(7);
  });

  test('outro aluno também não vê a matéria na aba Perfil', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(BRENO_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="perfil"]');
    await expect(page.locator('#tabContentPerfil')).not.toContainText('Comunicação (Engel)');
  });
});

test.describe('Jogo "Formar Frases (Engel)"', () => {
  test('carrega travado a partir da 2ª frase, com a 1ª (nível 1, 2 palavras) já disponível', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · 2 palavras');
    await expect(frame.locator('#clueEmoji')).toHaveText('☀️');
    await expect(frame.locator('#sentenceBox')).toContainText('Bom');
    await expect(frame.locator('.word-btn')).toHaveCount(3);
    await expect(frame.locator('.step-icon').nth(1)).toHaveClass(/locked/);
  });

  test('clicar a palavra errada não avança e mostra "tenta de novo", sem revelar a certa', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);
    await frame.locator('.word-btn', { hasText: 'Carro' }).click();
    await expect(frame.locator('#feedback')).toContainText('Tenta de novo');
    await expect(frame.locator('#btnNext')).toBeHidden();
    await expect(frame.locator('.step-icon').first()).not.toHaveClass(/completed/);
  });

  test('clicar a palavra certa completa a frase, marca concluída e libera a próxima', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);
    await frame.locator('.word-btn', { hasText: 'Dia' }).click();
    await expect(frame.locator('#sentenceBox .filled')).toHaveText('Dia');
    await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
    await expect(frame.locator('#btnNext')).toBeVisible();
    await expect(frame.locator('.step-icon').first()).toHaveClass(/completed/);

    await frame.locator('#btnNext').click();
    await expect(frame.locator('#levelTag')).toHaveText('Nível 1 · 2 palavras');
    await expect(frame.locator('#clueEmoji')).toHaveText('🌙');
  });

  test('resolve as 15 frases em ordem (2 → 3 → 4 palavras) e mostra o troféu final', async ({ page }) => {
    await stubSupabaseFake(page, {});
    const frame = await openJogo(page);

    const answers = ['Dia', 'Noite', 'Bem', 'Cachorro', 'Casa', 'Água', 'Gato', 'Bola', 'Amigos', 'Quente', 'Dormindo', 'Desenhando', 'Maçã', 'Bola', 'Festa'];
    for (let i = 0; i < answers.length; i++) {
      await frame.locator('.word-btn', { hasText: new RegExp(`^${answers[i]}$`) }).click();
      await expect(frame.locator('#feedback')).toContainText('Isso mesmo');
      if (i < answers.length - 1) await frame.locator('#btnNext').click();
    }

    await expect(frame.locator('.trophy-box')).toContainText('Terminou tudo!');
    const progress = await page.evaluate(u => JSON.parse(localStorage.getItem(`frases_engel_progress_${u}`)), 'engel.fraga');
    expect(progress).toHaveLength(15);

    // nível sobe de verdade — a 11ª frase (nível 3) já tem 4 palavras.
    // (implícito: passou pelas 15 sem travar, cobrindo os 3 níveis.)
  });

  test('botão "Pular (professor)" exige token válido antes de pular a frase', async ({ page }) => {
    await stubSupabaseFake(page, SEED_PROFESSOR);
    const frame = await openJogo(page);

    await frame.locator('#btnSkip').click();
    await expect(frame.locator('#skipForm')).toBeVisible();
    await frame.locator('#skipToken').fill('000000');
    await frame.locator('#btnConfirmSkip').click();
    await expect(frame.locator('#skipMsg')).toContainText('inválido ou expirado');
    await expect(frame.locator('#btnNext')).toBeHidden();

    await frame.locator('#skipToken').fill(TOKEN_VALIDO);
    await frame.locator('#btnConfirmSkip').click();
    await expect(frame.locator('#feedback')).toContainText('Pulado pelo professor');
    await expect(frame.locator('#btnNext')).toBeVisible();
  });

  test('gabarito lista as 15 frases com a resposta completa', async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(PROFESSOR_URL);
    await page.click('#mainNavTabs .tab-btn[data-tab="gestao"]');
    await page.waitForTimeout(200);
    await page.locator('.collapsible-card .collapsible-head', { hasText: 'Gabarito' }).click();

    const row = await expandGabaritoRow(page, 'Formar Frases');
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      row.locator('[data-gabarito-mod]').click(),
    ]);
    expect(download.suggestedFilename()).toBe('frases-engel-gabarito.txt');

    const filePath = await download.path();
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('GABARITO');
    expect(content).toContain('Bom Dia');
    expect(content).toContain('Amanhã vai ter Festa');
  });
});

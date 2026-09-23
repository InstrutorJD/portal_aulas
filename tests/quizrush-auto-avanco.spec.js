// @ts-check
// Dois avanços automáticos no QuizRush (games/quizrush.html), pra a partida
// não ficar parada esperando o professor clicar:
//
// 1) Pergunta: se TODO MUNDO que está na sala já respondeu, revela na hora —
//    não precisa esperar o cronômetro acabar nem o host clicar "Revelar
//    agora" (checkAllAnswered/hostAutoReveal).
// 2) Revelação: depois de alguns segundos (REVEAL_AUTO_ADVANCE_MS, "alguns
//    segundos" — encurtado nos testes via window.__QUIZRUSH_REVEAL_MS__),
//    avança sozinha pra próxima pergunta ou, na última, pro pódio
//    (startRevealCountdown). O host sempre pode clicar antes pra pular a
//    espera, e isso cancela o avanço automático.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

const HOST_URL = '/games/quizrush.html?user=admin&role=professor&name=Professor&turma=jogos';
const ALUNO_URL = '/games/quizrush.html?user=breno.silva80&role=aluno&name=Breno%20Silva&turma=jogos';

const q1 = { prompt: 'Quanto é 2 + 2?', options: ['3', '4', '5', '6'], correctIndex: 1 };
const q2 = { prompt: 'Quanto é 3 + 3?', options: ['5', '6', '7', '8'], correctIndex: 1 };

function session(extra = {}) {
  return {
    id: 'sess1', turma: 'jogos', created_by: 'admin', trilha_label: 'C#', module_title: 'Básico',
    questions: [q1, q2], current_index: 0, status: 'question', question_duration_ms: 60000,
    question_started_at: new Date().toISOString(), allow_steal: false, ...extra,
  };
}
const doisJogadores = [
  { session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva' },
  { session_id: 'sess1', student_email: 'edward.guzman', student_name: 'Edward Guzman' },
];

// Encurta o "alguns segundos" da revelação pra não esperar os 10s de
// verdade — ver window.__QUIZRUSH_REVEAL_MS__ em games/quizrush.html.
async function shortenRevealTimer(page, ms) {
  await page.addInitScript(m => { window.__QUIZRUSH_REVEAL_MS__ = m; }, ms);
}

test.describe('Revela sozinho quando todo mundo já respondeu', () => {
  test('falta 1 responder: continua na pergunta, mesmo com bastante tempo restante', async ({ page }) => {
    await stubSupabaseFake(page, {
      quizrush_sessions: [session()], quizrush_players: doisJogadores,
      quizrush_answers: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 1, is_correct: true, score: 900 }],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrQuestion')).toBeVisible();
    await expect(page.locator('#qHostStatus')).toContainText('1 de 2 responderam');
    await page.waitForTimeout(300);
    await expect(page.locator('#scrQuestion')).toBeVisible(); // ninguém empurrou pra revelação
  });

  test('o último aluno responde → revela na hora, sem clique nem tempo esgotado', async ({ page }) => {
    await stubSupabaseFake(page, {
      quizrush_sessions: [session()], quizrush_players: doisJogadores,
      quizrush_answers: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 1, is_correct: true, score: 900 }],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrQuestion')).toBeVisible();

    // simula a 2ª aluna respondendo (via outro cliente) e o push em tempo real chegando
    await page.evaluate(() => {
      window.__FAKE_DB__.quizrush_answers.push({
        session_id: 'sess1', student_email: 'edward.guzman', student_name: 'Edward Guzman',
        question_index: 0, choice_index: 1, is_correct: true, score: 700,
      });
      window.__fireFakeRealtime('quizrush_answers');
    });

    await expect(page.locator('#scrReveal')).toBeVisible();
    const board = await page.evaluate(() => currentLeaderboard().map(r => r.name));
    expect(board).toEqual(expect.arrayContaining(['Breno Silva', 'Edward Guzman']));

    const finalSession = await page.evaluate(() => window.__FAKE_DB__.quizrush_sessions.find(s => s.id === 'sess1'));
    expect(finalSession.status).toBe('reveal');
  });

  test('sala vazia (ninguém entrou ainda) não revela sozinha', async ({ page }) => {
    await stubSupabaseFake(page, { quizrush_sessions: [session()], quizrush_players: [] });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrQuestion')).toBeVisible();
    await page.waitForTimeout(300);
    await expect(page.locator('#scrQuestion')).toBeVisible();
  });

  test('vale pro Quizz Prático também: uma tentativa ERRADA já conta como "respondeu"', async ({ page }) => {
    const codeQ = {
      type: 'code', lang: 'js', topic: 'Funções', id: 'js-fn-1', level: 1, mode: 'write',
      title: 'O dobro', prompt: 'Crie a função dobro(n).', starter: 'function dobro(n) {\n  // seu código aqui\n}',
      check: { type: 'function', name: 'dobro' }, givenVars: [],
      tests: [{ args: [4], expected: 8 }], solution: 'function dobro(n) {\n  return n * 2;\n}', hint: 'Multiplique por 2.',
    };
    await stubSupabaseFake(page, {
      quizrush_sessions: [session({ questions: [codeQ] })], quizrush_players: doisJogadores,
      quizrush_answers: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 0, is_correct: false, score: 0, attempts: 1 }],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrQuestion')).toBeVisible();

    await page.evaluate(() => {
      window.__FAKE_DB__.quizrush_answers.push({
        session_id: 'sess1', student_email: 'edward.guzman', student_name: 'Edward Guzman',
        question_index: 0, choice_index: 0, is_correct: false, score: 0, attempts: 1,
      });
      window.__fireFakeRealtime('quizrush_answers');
    });

    await expect(page.locator('#scrReveal')).toBeVisible();
  });

  test('o professor pode revelar na mão antes de todo mundo responder (comportamento de sempre)', async ({ page }) => {
    await stubSupabaseFake(page, {
      quizrush_sessions: [session()], quizrush_players: doisJogadores,
      quizrush_answers: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 1, is_correct: true, score: 900 }],
    });
    await page.goto(HOST_URL);
    await page.click('#btnRevealNow');
    await expect(page.locator('#scrReveal')).toBeVisible();
  });
});

test.describe('Revelação avança sozinha depois de alguns segundos', () => {
  test('mostra uma contagem regressiva, diferente pro host e pro aluno', async ({ page }) => {
    await shortenRevealTimer(page, 60000); // não deixa disparar durante o teste, só olha o texto
    await stubSupabaseFake(page, {
      quizrush_sessions: [session({ status: 'reveal' })], quizrush_players: doisJogadores,
      quizrush_answers: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 1, is_correct: true, score: 900 }],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#revealCountdownLabel')).toContainText('Avança sozinho em');

    await page.goto(ALUNO_URL);
    await expect(page.locator('#revealCountdownLabel')).toContainText('Próxima pergunta em');
  });

  test('na ÚLTIMA pergunta, o texto avisa que o próximo passo é o pódio', async ({ page }) => {
    await shortenRevealTimer(page, 60000);
    await stubSupabaseFake(page, {
      quizrush_sessions: [session({ status: 'reveal', current_index: 1 })], quizrush_players: doisJogadores,
    });
    await page.goto(ALUNO_URL);
    await expect(page.locator('#revealCountdownLabel')).toContainText('Pódio final em');
  });

  test('sozinha, sem clicar em nada: avança pra próxima pergunta', async ({ page }) => {
    await shortenRevealTimer(page, 300);
    await stubSupabaseFake(page, {
      quizrush_sessions: [session({ status: 'reveal' })], quizrush_players: doisJogadores,
      quizrush_answers: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 1, is_correct: true, score: 900 }],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrReveal')).toBeVisible();

    await expect(page.locator('#scrQuestion')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#qMeta')).toContainText('Pergunta 2 de 2');
    const finalSession = await page.evaluate(() => window.__FAKE_DB__.quizrush_sessions.find(s => s.id === 'sess1'));
    expect(finalSession.current_index).toBe(1);
  });

  test('na última pergunta, avança sozinha pro pódio final', async ({ page }) => {
    await shortenRevealTimer(page, 300);
    await stubSupabaseFake(page, {
      quizrush_sessions: [session({ status: 'reveal', current_index: 1 })], quizrush_players: doisJogadores,
      quizrush_answers: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 1, choice_index: 1, is_correct: true, score: 900 }],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrPodium')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#podiumFullList')).toContainText('Breno Silva');
    const finalSession = await page.evaluate(() => window.__FAKE_DB__.quizrush_sessions.find(s => s.id === 'sess1'));
    expect(finalSession.status).toBe('podium');
  });

  test('clicar "Próxima Pergunta" na mão adianta o avanço e cancela o timer pendente (não pula uma pergunta a mais depois)', async ({ page }) => {
    await shortenRevealTimer(page, 800); // se o timer NÃO for cancelado, dispararia de novo durante o teste
    await stubSupabaseFake(page, {
      quizrush_sessions: [session({ status: 'reveal' })], quizrush_players: doisJogadores,
      quizrush_answers: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 1, is_correct: true, score: 900 }],
    });
    await page.goto(HOST_URL);
    await page.click('#btnNextOrPodium');
    await expect(page.locator('#qMeta')).toContainText('Pergunta 2 de 2');

    // espera passar do tempo que o timer (já cancelado) levaria pra disparar
    await page.waitForTimeout(1200);
    await expect(page.locator('#qMeta')).toContainText('Pergunta 2 de 2'); // continua na 2ª, não pulou pro pódio
    const finalSession = await page.evaluate(() => window.__FAKE_DB__.quizrush_sessions.find(s => s.id === 'sess1'));
    expect(finalSession.current_index).toBe(1);
    expect(finalSession.status).toBe('question');
  });

  // Só o HOST de fato avança a partida quando o tempo acaba (ver
  // startRevealCountdown) — um aluno sozinho, numa aba só, nunca avançaria
  // por conta própria mesmo que o contador dele chegasse a zero. Por isso o
  // teste roda como host (quem tem o timer que importa) e simula outra
  // aluna usando o poder dela por fora (banco falso + evento em tempo
  // real), igual aos outros testes desta suíte que simulam um 2º jogador.
  test('outra aluna usar "pegar pontos" durante a revelação não reinicia a contagem do host', async ({ page }) => {
    await shortenRevealTimer(page, 600);
    await stubSupabaseFake(page, {
      quizrush_sessions: [session({ status: 'reveal', allow_steal: true })], quizrush_players: doisJogadores,
      quizrush_answers: [
        { session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 1, is_correct: true, score: 900 },
        { session_id: 'sess1', student_email: 'edward.guzman', student_name: 'Edward Guzman', question_index: 0, choice_index: 1, is_correct: true, score: 500 },
      ],
    });
    await page.goto(HOST_URL);
    await expect(page.locator('#scrReveal')).toBeVisible();
    await page.waitForTimeout(300); // deixa a contagem do host correr um pouco antes do "poder" chegar

    await page.evaluate(() => {
      window.__FAKE_DB__.quizrush_powers.push({
        session_id: 'sess1', question_index: 0, student_email: 'edward.guzman', student_name: 'Edward Guzman', action: 'bonus', amount: 300,
      });
      window.__fireFakeRealtime('quizrush_powers');
    });
    await expect(page.locator('#revealPowerBox')).toContainText('bônus'); // renderReveal() rodou de novo com a jogada da colega

    // se a contagem tivesse reiniciado nesse re-render, ainda estaria na
    // revelação 600ms depois do reinício — mas passaram só ~300ms do
    // ORIGINAL desde o início, então já devia ter avançado no total de 600ms.
    await expect(page.locator('#scrQuestion')).toBeVisible({ timeout: 500 });
  });

  test('encerrar por emergência durante a revelação cancela o avanço automático pendente', async ({ page }) => {
    await shortenRevealTimer(page, 400);
    await stubSupabaseFake(page, {
      quizrush_sessions: [session({ status: 'reveal' })], quizrush_players: doisJogadores,
      quizrush_answers: [{ session_id: 'sess1', student_email: 'breno.silva80', student_name: 'Breno Silva', question_index: 0, choice_index: 1, is_correct: true, score: 900 }],
    });
    await page.goto(HOST_URL);
    page.once('dialog', dialog => dialog.accept());
    await page.click('#btnEmergencyEndReveal');
    await expect(page.locator('#scrSetup')).toBeVisible();

    await page.waitForTimeout(700); // passa do tempo que o timer levaria pra disparar
    await expect(page.locator('#scrSetup')).toBeVisible(); // não "ressuscitou" a partida encerrada
    const finalSession = await page.evaluate(() => window.__FAKE_DB__.quizrush_sessions.find(s => s.id === 'sess1'));
    expect(finalSession.status).toBe('ended');
  });
});

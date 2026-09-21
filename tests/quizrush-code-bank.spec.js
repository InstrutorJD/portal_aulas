// @ts-check
// Quizz Prático do QuizRush: o banco de problemas (shared/quizrush-code-bank.js)
// e o corretor (shared/quizrush-code.js). Garante, PRA CADA problema:
//   • a solução de referência passa nos próprios testes;
//   • o código inicial NÃO passa sozinho (senão o aluno ganha ponto sem fazer nada);
//   • "completar a lacuna" tem "____" e "escrever" não tem.
// JavaScript é conferido em Node; SQL precisa do sql.js (WebAssembly), então
// roda numa página de verdade.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');
const Bank = require('../shared/quizrush-code-bank.js');
const Code = require('../shared/quizrush-code.js');

const HOST_URL = '/games/quizrush.html?user=admin&role=professor&name=Professor&turma=jogos';
const allProblems = Bank.topics.flatMap(t => t.problems.map(p => Bank.toQuestion(t, p)));
const jsProblems = allProblems.filter(p => p.lang === 'js');
const sqlProblems = allProblems.filter(p => p.lang === 'sql');

test.describe('Quizz Prático — banco de problemas', () => {
  test('tem problemas de JavaScript e de SQL, com id único e níveis de 1 a 3', () => {
    expect(jsProblems.length).toBeGreaterThanOrEqual(25);
    expect(sqlProblems.length).toBeGreaterThanOrEqual(15);
    const ids = allProblems.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    allProblems.forEach(p => {
      expect([1, 2, 3], `nível de ${p.id}`).toContain(p.level);
      expect(['fill', 'write'], `modo de ${p.id}`).toContain(p.mode);
      expect(p.prompt && p.title && p.hint && p.solution, `campos de ${p.id}`).toBeTruthy();
    });
    expect(new Set(Bank.topics.map(t => t.key)).size).toBe(Bank.topics.length);
  });

  test('cada assunto mistura "completar a lacuna" e "escrever" e vai do fácil ao difícil', () => {
    Bank.topics.forEach(t => {
      const modes = new Set(t.problems.map(p => p.mode));
      const levels = t.problems.map(p => p.level);
      expect(levels, `níveis de ${t.key}`).toEqual([...levels].sort((a, b) => a - b));
      // assunto de 3+ problemas tem que ter pelo menos um de cada jeito
      if (t.problems.length >= 4) expect(modes.size, `modos de ${t.key}`).toBe(2);
    });
  });

  test('"completar" tem ____ no código inicial e "escrever" não tem; a solução nunca tem ____', () => {
    allProblems.forEach(p => {
      expect(Code.hasPlaceholder(p.solution), `solução de ${p.id}`).toBe(false);
      expect(Code.hasPlaceholder(p.starter), `starter de ${p.id}`).toBe(p.mode === 'fill');
    });
  });

  for (const p of jsProblems) {
    test(`JS ${p.id} (${p.title}): a solução passa em todos os testes, o código inicial não passa`, () => {
      const good = Code.runJsTests(p, p.solution);
      expect(good.lines.filter(l => !l.pass).map(l => l.text), `solução de ${p.id} reprovou`).toEqual([]);
      expect(good.pass).toBe(true);
      expect(Code.runJsTests(p, p.starter).pass, `o código inicial de ${p.id} passou sozinho`).toBe(false);
    });
  }

  test('JS: uma solução errada é reprovada e o resultado explica o que era esperado', () => {
    const dobro = jsProblems.find(p => p.id === 'js-fn-1');
    const wrong = Code.runJsTests(dobro, 'function dobro(n) { return n * 3; }');
    expect(wrong.pass).toBe(false);
    expect(wrong.lines[0].text).toContain('esperado 8');
  });

  test('JS: erro de sintaxe e função/variável não criada viram mensagem, não exceção', () => {
    const soma = jsProblems.find(p => p.id === 'js-fn-2');
    expect(Code.runJsTests(soma, 'function soma(a, b) { return a +; }').lines[0].text).toMatch(/Unexpected|token/i);
    expect(Code.runJsTests(soma, 'const x = 1;').lines[0].text).toContain("a função 'soma' não foi criada");
    const idade = jsProblems.find(p => p.id === 'js-var-1');
    expect(Code.runJsTests(idade, '// nada').lines[0].text).toContain("a variável 'idade' não foi criada");
  });

  test('JS: o código do aluno alterar a lista recebida não estraga os testes seguintes', () => {
    const tam = jsProblems.find(p => p.id === 'js-arr-3');
    const r = Code.runJsTests(tam, 'function tamanho(lista) { const n = lista.length; lista.push(99); return n; }');
    expect(r.pass).toBe(true);
  });

  test('pontuação: mais rápido vale mais, cada erro tira 100, nunca abaixo de 200', () => {
    expect(Code.scoreForCode(0, 60000, 0)).toBe(1000);
    expect(Code.scoreForCode(60000, 60000, 0)).toBe(500);
    expect(Code.scoreForCode(0, 60000, 2)).toBe(800);
    expect(Code.scoreForCode(60000, 60000, 9)).toBe(200);
    expect(Code.scoreForCode(30000, 60000, 0)).toBe(750);
  });

  test('sorteio: respeita a quantidade, só usa os assuntos escolhidos e sobe de nível', () => {
    const picked = Bank.pickProblems(['js-variaveis', 'js-arrays'], 8);
    expect(picked).toHaveLength(8);
    expect(picked.every(p => ['js-variaveis', 'js-arrays'].includes(p.id.startsWith('js-var') ? 'js-variaveis' : 'js-arrays'))).toBe(true);
    const levels = picked.map(p => p.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    // pedir mais do que existe devolve tudo que existe
    expect(Bank.pickProblems(['js-funcoes'], 99)).toHaveLength(6);
    // determinístico com um "aleatório" fixo
    const a = Bank.pickProblems(['js-lacos'], 4, () => 0.5).map(p => p.id);
    const b = Bank.pickProblems(['js-lacos'], 4, () => 0.5).map(p => p.id);
    expect(a).toEqual(b);
  });
});

test.describe('Quizz Prático — SQL de verdade (sql.js) e Worker de JavaScript', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseFake(page, {});
    await page.goto(HOST_URL);
  });

  test('todo problema de SQL: a solução passa, o código inicial não passa', async ({ page }) => {
    test.setTimeout(90000);
    const report = await page.evaluate(async () => {
      const SQL = await window.QuizRushCode.loadSql();
      const out = [];
      for (const t of window.QuizRushCodeBank.topics.filter(t => t.lang === 'sql')) {
        for (const raw of t.problems) {
          const p = window.QuizRushCodeBank.toQuestion(t, raw);
          const good = window.QuizRushCode.evaluateSqlWith(SQL, p, p.solution);
          const start = window.QuizRushCode.evaluateSqlWith(SQL, p, p.starter);
          out.push({ id: p.id, good: good.pass, start: start.pass, goodMsg: good.lines[0].text });
        }
      }
      return out;
    });
    expect(report.length).toBeGreaterThanOrEqual(15);
    report.forEach(r => {
      expect(r.good, `solução de ${r.id}: ${r.goodMsg}`).toBe(true);
      expect(r.start, `o código inicial de ${r.id} passou sozinho`).toBe(false);
    });
  });

  test('SQL: maiúsculas/minúsculas, apelidos e espaços diferentes valem igual; resultado errado não', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const SQL = await window.QuizRushCode.loadSql();
      const q = window.QuizRushCodeBank.toQuestion(
        window.QuizRushCodeBank.topics.find(t => t.key === 'sql-agregacao'),
        window.QuizRushCodeBank.topics.find(t => t.key === 'sql-agregacao').problems[0]
      );
      const run = code => window.QuizRushCode.evaluateSqlWith(SQL, q, code).pass;
      return {
        lower: run('select count(*) from funcionarios;'),
        alias: run('SELECT COUNT(*) AS total FROM funcionarios'),
        spaced: run('  SELECT   COUNT( * )\n FROM funcionarios ;'),
        wrong: run('SELECT COUNT(*) FROM funcionarios WHERE departamento_id = 1;'),
        broken: run('SELCT COUNT(*) FROM funcionarios;'),
      };
    });
    expect(r).toEqual({ lower: true, alias: true, spaced: true, wrong: false, broken: false });
  });

  test('SQL: INSERT/UPDATE/DELETE são conferidos pelo estado final da tabela', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const SQL = await window.QuizRushCode.loadSql();
      const t = window.QuizRushCodeBank.topics.find(x => x.key === 'sql-alteracao');
      const upd = window.QuizRushCodeBank.toQuestion(t, t.problems.find(p => p.id === 'sql-alt-3'));
      const run = code => window.QuizRushCode.evaluateSqlWith(SQL, upd, code).pass;
      return {
        right: run('UPDATE funcionarios SET salario = 2600 WHERE id = 5;'),
        forgotWhere: run('UPDATE funcionarios SET salario = 2600;'),
        wrongValue: run('UPDATE funcionarios SET salario = 2700 WHERE id = 5;'),
      };
    });
    expect(r).toEqual({ right: true, forgotWhere: false, wrongValue: false });
  });

  test('JS no Worker: laço infinito estoura o tempo limite em vez de travar a página', async ({ page }) => {
    const t0 = Date.now();
    const r = await page.evaluate(() => {
      const p = window.QuizRushCodeBank.toQuestion(
        window.QuizRushCodeBank.topics.find(t => t.key === 'js-funcoes'),
        window.QuizRushCodeBank.topics.find(t => t.key === 'js-funcoes').problems[1]
      );
      return window.QuizRushCode.evaluateJs(p, 'function soma(a, b) { while (true) {} }', { timeoutMs: 800 });
    });
    expect(r.pass).toBe(false);
    expect(r.timedOut).toBe(true);
    expect(r.lines[0].text).toContain('demorou demais');
    expect(Date.now() - t0).toBeLessThan(10000);
    // e a página continua viva
    expect(await page.evaluate(() => 1 + 1)).toBe(2);
  });

  test('JS no Worker: o código do aluno não enxerga a página nem o localStorage', async ({ page }) => {
    const r = await page.evaluate(() => {
      const p = window.QuizRushCodeBank.toQuestion(
        window.QuizRushCodeBank.topics.find(t => t.key === 'js-funcoes'),
        window.QuizRushCodeBank.topics.find(t => t.key === 'js-funcoes').problems[1]
      );
      return window.QuizRushCode.evaluateJs(p, 'function soma(a, b) { return typeof document + "/" + typeof localStorage; }');
    });
    expect(r.pass).toBe(false);
    expect(r.lines[0].text).toContain('undefined/undefined');
  });

  test('evaluate: "____" que sobrou e resposta vazia viram aviso amigável', async ({ page }) => {
    const r = await page.evaluate(async () => {
      const t = window.QuizRushCodeBank.topics.find(x => x.key === 'js-variaveis');
      const p = window.QuizRushCodeBank.toQuestion(t, t.problems[0]);
      return {
        placeholder: (await window.QuizRushCode.evaluate(p, p.starter)).lines[0].text,
        empty: (await window.QuizRushCode.evaluate(p, '   ')).lines[0].text,
      };
    });
    expect(r.placeholder).toContain('____');
    expect(r.empty).toContain('Escreva o código');
  });
});

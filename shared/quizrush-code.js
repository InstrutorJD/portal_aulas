// Correção dos problemas de código do "Quizz Prático" do QuizRush
// (games/quizrush.html). Recebe um problema (formato do banco em
// shared/quizrush-code-bank.js) + o código que o aluno digitou e devolve se
// passou, com uma linha de resultado por caso de teste — sem tocar em DOM,
// então o mesmo arquivo roda em Node (tests/quizrush-code-bank.spec.js
// confere que cada problema do banco é resolvível e que o código inicial
// NÃO passa sozinho).
//
// JavaScript roda de verdade, dentro de um Web Worker descartável: um laço
// infinito no código do aluno só estoura o tempo limite (o Worker é
// encerrado), em vez de congelar a tela da partida ao vivo; e o código não
// enxerga a página, o localStorage nem a sessão do Supabase.
//
// SQL roda de verdade também, em SQLite via WebAssembly (sql.js — o mesmo
// motor dos módulos de SQL do portal): a consulta do aluno e a solução de
// referência rodam em bancos novos, e só o RESULTADO precisa bater (os nomes
// das colunas são ignorados, então `count(*)`, `COUNT(*)` e `COUNT(*) AS total`
// valem igual).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuizRushCode = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- JavaScript ----------

  // Núcleo síncrono. Precisa ser AUTOCONTIDO (sem usar nada de fora dele):
  // o Worker recebe o texto desta função via toString().
  //   item.check.type: 'variable' (cria a variável check.name), 'function'
  //   (declara a função check.name) ou 'console' (exibe com console.log/alert).
  function runJsTests(item, code) {
    var check = item.check || {};
    var givenVars = item.givenVars || [];
    var show = function (v) {
      if (v === undefined) return 'undefined';
      try { return JSON.stringify(v); } catch (e) { return String(v); }
    };
    var lines = [];
    var pass = true;

    for (var i = 0; i < item.tests.length; i++) {
      var t = item.tests[i];
      var label;
      if (check.type === 'function') {
        label = check.name + '(' + (t.args || []).map(show).join(', ') + ')';
      } else {
        var keys = Object.keys(t.values || {});
        label = keys.length ? keys.map(function (k) { return k + ' = ' + show(t.values[k]); }).join(', ') : 'sem entradas';
      }

      var out;
      try {
        if (check.type === 'console') {
          var logs = [];
          var fakeConsole = { log: function () { var a = Array.prototype.slice.call(arguments); logs.push(a.length === 1 ? a[0] : a.join(' ')); } };
          var fakeAlert = function (m) { logs.push(m); };
          var names = givenVars.concat(['console', 'alert', code]);
          var fn = Function.apply(null, names);
          fn.apply(null, givenVars.map(function (n) { return t.values[n]; }).concat([fakeConsole, fakeAlert]));
          out = logs.length ? { value: logs } : { error: 'nada foi exibido — use console.log(...)' };
        } else if (check.type === 'function') {
          var factory = new Function(code + '\nreturn typeof ' + check.name + " === 'function' ? " + check.name + ' : undefined;');
          var f = factory();
          // clona os argumentos: o código do aluno pode alterar o array recebido.
          out = typeof f === 'function'
            ? { value: f.apply(null, JSON.parse(JSON.stringify(t.args || []))) }
            : { error: "a função '" + check.name + "' não foi criada" };
        } else {
          var params = givenVars.concat([code + '\nreturn typeof ' + check.name + " !== 'undefined' ? " + check.name + ' : undefined;']);
          var v = Function.apply(null, params).apply(null, givenVars.map(function (n) { return t.values[n]; }));
          out = v === undefined ? { error: "a variável '" + check.name + "' não foi criada" } : { value: v };
        }
      } catch (err) {
        out = { error: (err && err.message) || String(err) };
      }

      var ok = !out.error && show(out.value) === show(t.expected);
      if (!ok) pass = false;
      var verb = check.type === 'console' ? 'exibiu ' : check.type === 'function' ? 'retornou ' : check.name + ' = ';
      lines.push({
        pass: ok,
        text: 'Teste ' + (i + 1) + ': ' + label + ' → ' +
          (out.error ? out.error : verb + show(out.value) + (ok ? '' : ' (esperado ' + show(t.expected) + ')')),
      });
    }
    return { pass: pass, lines: lines };
  }

  function evaluateJs(item, code, opts) {
    var timeoutMs = (opts && opts.timeoutMs) || 3000;
    var canWorker = typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL;
    if (!canWorker) return Promise.resolve(runJsTests(item, code));

    return new Promise(function (resolve) {
      var src = 'var runJsTests = ' + runJsTests.toString() + ';\n' +
        'onmessage = function (e) { postMessage(runJsTests(e.data.item, e.data.code)); };';
      var url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      var worker = new Worker(url);
      var done = false;
      var timer;
      function finish(result) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        worker.terminate();
        URL.revokeObjectURL(url);
        resolve(result);
      }
      timer = setTimeout(function () {
        finish({ pass: false, timedOut: true, lines: [{ pass: false, text: '⏱️ O código demorou demais pra rodar — tem algum laço que nunca termina?' }] });
      }, timeoutMs);
      worker.onmessage = function (e) { finish(e.data); };
      worker.onerror = function (e) { finish({ pass: false, lines: [{ pass: false, text: 'Erro ao executar o código: ' + (e.message || 'desconhecido') }] }); };
      worker.postMessage({ item: item, code: code });
    });
  }

  // ---------- SQL ----------

  // Mesmo banco de exemplo dos módulos de SQL do portal (sql-basico,
  // sql-agregacao, sql-join). Recriado do zero antes de CADA execução, então
  // nenhum problema depende do estado deixado por outro.
  var SEED_SQL = [
    'CREATE TABLE departamentos (id INTEGER PRIMARY KEY, nome TEXT NOT NULL);',
    'CREATE TABLE funcionarios (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, cargo TEXT NOT NULL, departamento_id INTEGER, salario REAL NOT NULL);',
    "INSERT INTO departamentos (id, nome) VALUES (1, 'Desenvolvimento'), (2, 'Suporte'), (3, 'Diretoria');",
    'INSERT INTO funcionarios (id, nome, cargo, departamento_id, salario) VALUES',
    "  (1, 'Ana Beatriz', 'Desenvolvedora', 1, 4200.00),",
    "  (2, 'Carlos Eduardo', 'Analista de Suporte', 2, 2800.00),",
    "  (3, 'Fernanda Lima', 'Desenvolvedora Pleno', 1, 5300.00),",
    "  (4, 'Rodrigo Alves', 'Diretor de TI', 3, 9800.00),",
    "  (5, 'Juliana Costa', 'Estagiária', 1, 1400.00);",
  ].join('\n');

  var SQL_VERSION = '1.10.3';
  var sqlPromise = null;

  // Carrega o sql.js só na primeira vez que um problema de SQL aparece —
  // partida de JavaScript nunca baixa o WebAssembly.
  function loadSql() {
    if (sqlPromise) return sqlPromise;
    var base = 'https://cdn.jsdelivr.net/npm/sql.js@' + SQL_VERSION + '/dist/';
    sqlPromise = new Promise(function (resolve, reject) {
      function init() {
        window.initSqlJs({ locateFile: function (f) { return base + f; } }).then(resolve, reject);
      }
      if (typeof window.initSqlJs === 'function') { init(); return; }
      var s = document.createElement('script');
      s.src = base + 'sql-wasm.js';
      s.onload = init;
      s.onerror = function () { reject(new Error('não foi possível baixar o motor de SQL (verifique a internet)')); };
      document.head.appendChild(s);
    }).catch(function (e) { sqlPromise = null; throw e; });
    return sqlPromise;
  }

  function execLast(db, sql) {
    var results = db.exec(sql);
    return results && results.length ? results[results.length - 1] : { columns: [], values: [] };
  }

  function sameResult(expected, actual, orderMatters) {
    if (expected.columns.length !== actual.columns.length) return false;
    var e = expected.values.map(function (r) { return JSON.stringify(r); });
    var a = actual.values.map(function (r) { return JSON.stringify(r); });
    if (e.length !== a.length) return false;
    if (!orderMatters) { e.sort(); a.sort(); }
    return e.every(function (v, i) { return v === a[i]; });
  }

  function evaluateSqlWith(SQL, item, code) {
    var verify = item.verifyQuery || null;

    var expectedDb = new SQL.Database();
    expectedDb.run(SEED_SQL);
    expectedDb.run(item.solution);
    var expected = execLast(expectedDb, verify || item.solution);
    expectedDb.close();

    var studentDb = new SQL.Database();
    var actual = null, error = null;
    try {
      studentDb.run(SEED_SQL);
      studentDb.run(code);
      actual = execLast(studentDb, verify || code);
    } catch (err) {
      error = err.message;
    }
    studentDb.close();

    if (error) return { pass: false, lines: [{ pass: false, text: 'Erro na consulta: ' + error }] };

    var ok = sameResult(expected, actual, item.orderMatters);
    var preview = { columns: actual.columns, values: actual.values.slice(0, 6), total: actual.values.length };
    return {
      pass: ok,
      preview: preview,
      lines: [{
        pass: ok,
        text: ok
          ? 'Resultado certo: ' + actual.values.length + ' linha(s) ✅'
          : 'O resultado não bateu com o esperado (sua consulta retornou ' + actual.values.length + ' linha(s), o esperado tem ' + expected.values.length + ').',
      }],
    };
  }

  function evaluateSql(item, code) {
    return loadSql().then(function (SQL) {
      return evaluateSqlWith(SQL, item, code);
    }, function (err) {
      return { pass: false, lines: [{ pass: false, text: 'Motor de SQL indisponível: ' + err.message }] };
    });
  }

  // ---------- Entrada única + pontuação ----------

  // Sobrou algum "____" do código inicial? Melhor avisar do que deixar o aluno
  // ler um "Unexpected token" do JavaScript ou do SQLite.
  function hasPlaceholder(code) { return /_{3,}/.test(code || ''); }

  // `skipped: true` = nem chegou a rodar (vazio ou ainda com "____"): a tela
  // avisa, mas NÃO conta como tentativa errada (não tira pontos).
  function evaluate(item, code, opts) {
    if (!String(code || '').trim()) {
      return Promise.resolve({ pass: false, skipped: true, lines: [{ pass: false, text: 'Escreva o código antes de enviar.' }] });
    }
    if (hasPlaceholder(code)) {
      return Promise.resolve({ pass: false, skipped: true, placeholder: true, lines: [{ pass: false, text: 'Ainda tem "____" no código — troque pela parte que falta.' }] });
    }
    return item.lang === 'sql' ? evaluateSql(item, code) : evaluateJs(item, code, opts);
  }

  // Mesma ideia do acerto no QuizRush comum (500 a 1000, mais rápido = mais
  // pontos), só que cada tentativa errada antes do acerto tira 100 — sem isso,
  // dispararia código aleatório até passar. Mínimo 200: quem acerta sempre
  // pontua mais do que quem não acerta.
  function scoreForCode(elapsedMs, durationMs, wrongAttempts) {
    var ratio = Math.max(0, Math.min(1, elapsedMs / (durationMs || 1)));
    var base = Math.round(500 + 500 * (1 - ratio));
    return Math.max(200, base - 100 * Math.max(0, wrongAttempts || 0));
  }

  return { runJsTests: runJsTests, evaluateJs: evaluateJs, evaluateSql: evaluateSql, evaluateSqlWith: evaluateSqlWith, evaluate: evaluate, loadSql: loadSql, hasPlaceholder: hasPlaceholder, scoreForCode: scoreForCode, SEED_SQL: SEED_SQL };
});

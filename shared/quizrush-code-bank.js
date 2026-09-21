// Banco de problemas do "Quizz Prático" do QuizRush (games/quizrush.html).
//
// Problemas CURTOS, sobre assuntos que já foram vistos nas aulas do portal
// (variáveis/operadores, condicionais, funções, laços e arrays em JavaScript;
// SELECT, INSERT/UPDATE/DELETE, agregação e JOIN em SQL). O professor escolhe
// os assuntos na hora de criar a partida — nada precisa ser cadastrado.
//
// Cada problema:
//   id, level (1 fácil → 3 difícil; a partida sobe de nível), mode:
//   'fill'  → o aluno completa um "____" num código já pronto
//   'write' → o aluno escreve o código do zero (ex.: "crie a variável ...")
//   title, prompt (HTML), starter (o que aparece no editor), hint (aparece
//   depois de 2 erros) e solution (solução de referência: aparece na revelação
//   e, no SQL, é o que define o resultado esperado).
//   JavaScript: check ({type:'variable'|'function'|'console', name}),
//               givenVars (variáveis já criadas) e tests ([{values|args, expected}]).
//   SQL: verifyQuery (opcional; o que consultar depois de INSERT/UPDATE/DELETE
//        pra comparar o estado do banco) e orderMatters.
// Formato dos testes de JavaScript = mesmo dos desafios dos módulos práticos
// (shared/js-challenge-engine.js). O teste tests/quizrush-code-bank.spec.js
// garante que cada solução passa e que o código inicial NÃO passa sozinho.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuizRushCodeBank = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const variable = name => ({ type: 'variable', name });
  const fn = name => ({ type: 'function', name });
  const consoleOut = { type: 'console' };
  const ALL_EMP = 'SELECT * FROM funcionarios ORDER BY id;';

  const topics = [
    // ------------------------------------------------------------------ JS
    {
      key: 'js-variaveis', lang: 'js', label: 'JavaScript — Variáveis, operadores e texto',
      problems: [
        {
          id: 'js-var-1', level: 1, mode: 'fill', title: 'Guardando um número',
          prompt: 'Troque <code>____</code> para que a variável <code>idade</code> guarde o número <b>16</b>.',
          starter: 'let idade = ____;', check: variable('idade'), givenVars: [],
          tests: [{ values: {}, expected: 16 }], solution: 'let idade = 16;',
          hint: 'Números são escritos direto, sem aspas: <code>let x = 5;</code>',
        },
        {
          id: 'js-var-2', level: 1, mode: 'write', title: 'Guardando um texto',
          prompt: 'Crie a variável <code>nome</code> com o texto <b>Ana</b>.',
          starter: '// crie a variável nome com o texto Ana\n', check: variable('nome'), givenVars: [],
          tests: [{ values: {}, expected: 'Ana' }], solution: 'let nome = "Ana";',
          hint: 'Texto vai entre aspas: <code>let cidade = "Goiânia";</code>',
        },
        {
          id: 'js-var-3', level: 1, mode: 'fill', title: 'Somando duas variáveis',
          prompt: 'As variáveis <code>a</code> e <code>b</code> já existem. Troque <code>____</code> pelo operador certo para <code>total</code> ser a <b>soma</b> delas.',
          starter: 'let total = a ____ b;', check: variable('total'), givenVars: ['a', 'b'],
          tests: [{ values: { a: 2, b: 3 }, expected: 5 }, { values: { a: 10, b: 15 }, expected: 25 }],
          solution: 'let total = a + b;', hint: 'O operador de soma é o <code>+</code>.',
        },
        {
          id: 'js-var-4', level: 2, mode: 'fill', title: 'Resto da divisão',
          prompt: 'Troque <code>____</code> pelo operador que dá o <b>resto da divisão</b> de <code>a</code> por <code>b</code>.',
          starter: 'let sobra = a ____ b;', check: variable('sobra'), givenVars: ['a', 'b'],
          tests: [{ values: { a: 10, b: 3 }, expected: 1 }, { values: { a: 9, b: 3 }, expected: 0 }, { values: { a: 7, b: 2 }, expected: 1 }],
          solution: 'let sobra = a % b;', hint: 'O resto da divisão usa o símbolo de porcentagem: <code>%</code>.',
        },
        {
          id: 'js-var-5', level: 2, mode: 'write', title: 'O dobro de um número',
          prompt: 'A variável <code>n</code> já existe. Crie a variável <code>dobro</code> com o <b>dobro</b> de <code>n</code>.',
          starter: '// crie a variável dobro\n', check: variable('dobro'), givenVars: ['n'],
          tests: [{ values: { n: 4 }, expected: 8 }, { values: { n: 0 }, expected: 0 }, { values: { n: -3 }, expected: -6 }],
          solution: 'let dobro = n * 2;', hint: 'Multiplicar é com <code>*</code>.',
        },
        {
          id: 'js-var-6', level: 2, mode: 'write', title: 'Montando uma saudação',
          prompt: 'A variável <code>nome</code> já existe. Crie a variável <code>saudacao</code> com o texto <b>Olá, </b> + o nome + <b>!</b> (ex.: <code>Olá, Ana!</code>).',
          starter: '// crie a variável saudacao\n', check: variable('saudacao'), givenVars: ['nome'],
          tests: [{ values: { nome: 'Ana' }, expected: 'Olá, Ana!' }, { values: { nome: 'Eri' }, expected: 'Olá, Eri!' }],
          solution: 'let saudacao = "Olá, " + nome + "!";', hint: 'Use <code>+</code> pra juntar textos: <code>"Oi, " + nome</code>.',
        },
        {
          id: 'js-var-7', level: 2, mode: 'write', title: 'Média de duas notas',
          prompt: 'As variáveis <code>a</code> e <code>b</code> são duas notas. Crie a variável <code>media</code> com a <b>média</b> delas.',
          starter: '// crie a variável media\n', check: variable('media'), givenVars: ['a', 'b'],
          tests: [{ values: { a: 4, b: 6 }, expected: 5 }, { values: { a: 7, b: 8 }, expected: 7.5 }, { values: { a: 0, b: 0 }, expected: 0 }],
          solution: 'let media = (a + b) / 2;', hint: 'Some primeiro (use parênteses!) e depois divida por 2.',
        },
        {
          id: 'js-var-8', level: 2, mode: 'write', title: 'Mostrando no console',
          prompt: 'A variável <code>nome</code> já existe. Use <code>console.log</code> para mostrar o texto <b>Bem-vindo, </b> seguido do nome (ex.: <code>Bem-vindo, Eri</code>).',
          starter: '// mostre a mensagem com console.log\n', check: consoleOut, givenVars: ['nome'],
          tests: [{ values: { nome: 'Eri' }, expected: ['Bem-vindo, Eri'] }, { values: { nome: 'Zed' }, expected: ['Bem-vindo, Zed'] }],
          solution: 'console.log("Bem-vindo, " + nome);', hint: '<code>console.log("texto " + variavel);</code>',
        },
      ],
    },
    {
      key: 'js-condicionais', lang: 'js', label: 'JavaScript — Condicionais (if / else)',
      problems: [
        {
          id: 'js-if-1', level: 1, mode: 'fill', title: 'Maioridade',
          prompt: 'Troque <code>____</code> pelo operador de comparação: a função deve devolver <code>true</code> quando <code>idade</code> for <b>18 ou mais</b>.',
          starter: 'function maiorDeIdade(idade) {\n  return idade ____ 18;\n}', check: fn('maiorDeIdade'), givenVars: [],
          tests: [{ args: [17], expected: false }, { args: [18], expected: true }, { args: [30], expected: true }],
          solution: 'function maiorDeIdade(idade) {\n  return idade >= 18;\n}', hint: '"Maior ou igual" se escreve <code>>=</code>.',
        },
        {
          id: 'js-if-2', level: 1, mode: 'fill', title: 'Aprovado ou reprovado',
          prompt: 'Complete o <code>else</code>: quem tira menos de 6 fica <b>reprovado</b>.',
          starter: 'function resultado(nota) {\n  if (nota >= 6) {\n    return "aprovado";\n  } else {\n    return ____;\n  }\n}', check: fn('resultado'), givenVars: [],
          tests: [{ args: [7], expected: 'aprovado' }, { args: [6], expected: 'aprovado' }, { args: [3], expected: 'reprovado' }],
          solution: 'function resultado(nota) {\n  if (nota >= 6) {\n    return "aprovado";\n  } else {\n    return "reprovado";\n  }\n}', hint: 'Devolva o texto entre aspas: <code>"reprovado"</code>.',
        },
        {
          id: 'js-if-3', level: 2, mode: 'write', title: 'Par ou ímpar',
          prompt: 'Crie a função <code>parOuImpar(n)</code> que devolve o texto <b>"par"</b> ou <b>"ímpar"</b>.',
          starter: 'function parOuImpar(n) {\n  // seu código aqui\n}', check: fn('parOuImpar'), givenVars: [],
          tests: [{ args: [4], expected: 'par' }, { args: [7], expected: 'ímpar' }, { args: [0], expected: 'par' }],
          solution: 'function parOuImpar(n) {\n  if (n % 2 === 0) {\n    return "par";\n  }\n  return "ímpar";\n}', hint: 'Um número é par quando o resto da divisão por 2 é 0: <code>n % 2 === 0</code>.',
        },
        {
          id: 'js-if-4', level: 2, mode: 'write', title: 'Saldo suficiente',
          prompt: 'Crie a função <code>saldoSuficiente(saldo, valor)</code> que devolve <code>true</code> se o saldo cobre o valor da compra (saldo <b>maior ou igual</b> ao valor).',
          starter: 'function saldoSuficiente(saldo, valor) {\n  // seu código aqui\n}', check: fn('saldoSuficiente'), givenVars: [],
          tests: [{ args: [100, 50], expected: true }, { args: [50, 50], expected: true }, { args: [20, 50], expected: false }],
          solution: 'function saldoSuficiente(saldo, valor) {\n  return saldo >= valor;\n}', hint: 'Uma comparação já devolve <code>true</code> ou <code>false</code>.',
        },
        {
          id: 'js-if-5', level: 2, mode: 'write', title: 'O maior de dois',
          prompt: 'Crie a função <code>maior(a, b)</code> que devolve o <b>maior</b> dos dois números.',
          starter: 'function maior(a, b) {\n  // seu código aqui\n}', check: fn('maior'), givenVars: [],
          tests: [{ args: [3, 9], expected: 9 }, { args: [10, 2], expected: 10 }, { args: [5, 5], expected: 5 }, { args: [-1, -7], expected: -1 }],
          solution: 'function maior(a, b) {\n  if (a > b) {\n    return a;\n  }\n  return b;\n}', hint: 'Compare com <code>if (a > b)</code> e devolva um dos dois.',
        },
        {
          id: 'js-if-6', level: 3, mode: 'write', title: 'Sinal do número',
          prompt: 'Crie a função <code>sinal(n)</code> que devolve <b>"positivo"</b>, <b>"negativo"</b> ou <b>"zero"</b>.',
          starter: 'function sinal(n) {\n  // seu código aqui\n}', check: fn('sinal'), givenVars: [],
          tests: [{ args: [5], expected: 'positivo' }, { args: [-2], expected: 'negativo' }, { args: [0], expected: 'zero' }],
          solution: 'function sinal(n) {\n  if (n > 0) {\n    return "positivo";\n  } else if (n < 0) {\n    return "negativo";\n  }\n  return "zero";\n}', hint: 'Use <code>if</code>, <code>else if</code> e um caso final para o zero.',
        },
      ],
    },
    {
      key: 'js-funcoes', lang: 'js', label: 'JavaScript — Funções',
      problems: [
        {
          id: 'js-fn-1', level: 1, mode: 'fill', title: 'O dobro',
          prompt: 'Complete a função para ela devolver o <b>dobro</b> de <code>n</code>.',
          starter: 'function dobro(n) {\n  return n * ____;\n}', check: fn('dobro'), givenVars: [],
          tests: [{ args: [4], expected: 8 }, { args: [0], expected: 0 }, { args: [-5], expected: -10 }],
          solution: 'function dobro(n) {\n  return n * 2;\n}', hint: 'O dobro é multiplicar por 2.',
        },
        {
          id: 'js-fn-2', level: 1, mode: 'write', title: 'Somando dois números',
          prompt: 'Crie a função <code>soma(a, b)</code> que devolve a <b>soma</b> dos dois números.',
          starter: 'function soma(a, b) {\n  // seu código aqui\n}', check: fn('soma'), givenVars: [],
          tests: [{ args: [2, 3], expected: 5 }, { args: [10, -4], expected: 6 }, { args: [0, 0], expected: 0 }],
          solution: 'function soma(a, b) {\n  return a + b;\n}', hint: 'Use <code>return</code> para devolver o resultado.',
        },
        {
          id: 'js-fn-3', level: 1, mode: 'write', title: 'Saudação',
          prompt: 'Crie a função <code>saudacao(nome)</code> que devolve o texto <b>Olá, </b> + o nome (ex.: <code>Olá, Ana</code>).',
          starter: 'function saudacao(nome) {\n  // seu código aqui\n}', check: fn('saudacao'), givenVars: [],
          tests: [{ args: ['Ana'], expected: 'Olá, Ana' }, { args: ['Eri'], expected: 'Olá, Eri' }],
          solution: 'function saudacao(nome) {\n  return "Olá, " + nome;\n}', hint: 'Junte os textos com <code>+</code>.',
        },
        {
          id: 'js-fn-4', level: 2, mode: 'write', title: 'Área do retângulo',
          prompt: 'Crie a função <code>areaRetangulo(base, altura)</code> que devolve a <b>área</b> (base × altura).',
          starter: 'function areaRetangulo(base, altura) {\n  // seu código aqui\n}', check: fn('areaRetangulo'), givenVars: [],
          tests: [{ args: [3, 4], expected: 12 }, { args: [5, 5], expected: 25 }, { args: [7, 0], expected: 0 }],
          solution: 'function areaRetangulo(base, altura) {\n  return base * altura;\n}', hint: 'Área = base vezes altura.',
        },
        {
          id: 'js-fn-5', level: 2, mode: 'write', title: 'Celsius para Fahrenheit',
          prompt: 'Crie a função <code>celsiusParaFahrenheit(c)</code> usando a fórmula <b>c × 9 / 5 + 32</b>.',
          starter: 'function celsiusParaFahrenheit(c) {\n  // seu código aqui\n}', check: fn('celsiusParaFahrenheit'), givenVars: [],
          tests: [{ args: [0], expected: 32 }, { args: [100], expected: 212 }, { args: [-40], expected: -40 }],
          solution: 'function celsiusParaFahrenheit(c) {\n  return c * 9 / 5 + 32;\n}', hint: 'Escreva a fórmula direto no <code>return</code>.',
        },
        {
          id: 'js-fn-6', level: 3, mode: 'write', title: 'Preço com desconto',
          prompt: 'Crie a função <code>precoComDesconto(preco, percentual)</code> que devolve o preço <b>depois de descontar</b> o percentual (ex.: 200 com 10% → 180).',
          starter: 'function precoComDesconto(preco, percentual) {\n  // seu código aqui\n}', check: fn('precoComDesconto'), givenVars: [],
          tests: [{ args: [200, 10], expected: 180 }, { args: [50, 50], expected: 25 }, { args: [100, 0], expected: 100 }],
          solution: 'function precoComDesconto(preco, percentual) {\n  return preco - preco * percentual / 100;\n}', hint: 'O desconto é <code>preco * percentual / 100</code>. Subtraia do preço.',
        },
      ],
    },
    {
      key: 'js-lacos', lang: 'js', label: 'JavaScript — Laços (for)',
      problems: [
        {
          id: 'js-for-1', level: 1, mode: 'fill', title: 'Somando com um laço',
          prompt: 'O laço passa por <code>i</code> de 1 até <code>n</code>. Troque <code>____</code> para somar cada <code>i</code> no <code>total</code>.',
          starter: 'function somaAte(n) {\n  let total = 0;\n  for (let i = 1; i <= n; i++) {\n    total += ____;\n  }\n  return total;\n}', check: fn('somaAte'), givenVars: [],
          tests: [{ args: [3], expected: 6 }, { args: [10], expected: 55 }, { args: [1], expected: 1 }],
          solution: 'function somaAte(n) {\n  let total = 0;\n  for (let i = 1; i <= n; i++) {\n    total += i;\n  }\n  return total;\n}', hint: 'A cada volta, some o valor de <code>i</code>.',
        },
        {
          id: 'js-for-2', level: 1, mode: 'fill', title: 'Contando até n',
          prompt: 'Troque <code>____</code> pela condição para o laço rodar de 1 <b>até n, incluindo o n</b>.',
          starter: 'function contarAte(n) {\n  let texto = "";\n  for (let i = 1; i ____ n; i++) {\n    texto += i;\n  }\n  return texto;\n}', check: fn('contarAte'), givenVars: [],
          tests: [{ args: [3], expected: '123' }, { args: [1], expected: '1' }, { args: [5], expected: '12345' }],
          solution: 'function contarAte(n) {\n  let texto = "";\n  for (let i = 1; i <= n; i++) {\n    texto += i;\n  }\n  return texto;\n}', hint: 'Para incluir o <code>n</code> use "menor ou igual": <code><=</code>.',
        },
        {
          id: 'js-for-3', level: 2, mode: 'write', title: 'Repetindo um texto',
          prompt: 'Crie a função <code>repetir(texto, vezes)</code> que devolve o texto repetido <code>vezes</code> vezes (ex.: <code>repetir("ab", 3)</code> → <code>"ababab"</code>).',
          starter: 'function repetir(texto, vezes) {\n  // seu código aqui\n}', check: fn('repetir'), givenVars: [],
          tests: [{ args: ['ab', 3], expected: 'ababab' }, { args: ['x', 1], expected: 'x' }, { args: ['oi', 0], expected: '' }],
          solution: 'function repetir(texto, vezes) {\n  let resultado = "";\n  for (let i = 0; i < vezes; i++) {\n    resultado += texto;\n  }\n  return resultado;\n}', hint: 'Comece com <code>let resultado = ""</code> e some o texto a cada volta do <code>for</code>.',
        },
        {
          id: 'js-for-4', level: 2, mode: 'write', title: 'Contando os pares',
          prompt: 'Crie a função <code>contarPares(n)</code> que devolve <b>quantos números pares</b> existem de 1 até <code>n</code>.',
          starter: 'function contarPares(n) {\n  // seu código aqui\n}', check: fn('contarPares'), givenVars: [],
          tests: [{ args: [10], expected: 5 }, { args: [1], expected: 0 }, { args: [7], expected: 3 }],
          solution: 'function contarPares(n) {\n  let contador = 0;\n  for (let i = 1; i <= n; i++) {\n    if (i % 2 === 0) {\n      contador++;\n    }\n  }\n  return contador;\n}', hint: 'Dentro do laço, teste <code>i % 2 === 0</code> e some 1 no contador.',
        },
        {
          id: 'js-for-5', level: 3, mode: 'write', title: 'Fatorial',
          prompt: 'Crie a função <code>fatorial(n)</code> que devolve n! (ex.: 4! = 4 × 3 × 2 × 1 = 24). Considere que <code>n</code> é sempre 1 ou mais.',
          starter: 'function fatorial(n) {\n  // seu código aqui\n}', check: fn('fatorial'), givenVars: [],
          tests: [{ args: [1], expected: 1 }, { args: [4], expected: 24 }, { args: [5], expected: 120 }],
          solution: 'function fatorial(n) {\n  let resultado = 1;\n  for (let i = 2; i <= n; i++) {\n    resultado *= i;\n  }\n  return resultado;\n}', hint: 'Comece o resultado em 1 e multiplique por cada número de 2 até <code>n</code>.',
        },
        {
          id: 'js-for-6', level: 3, mode: 'write', title: 'Tabuada no console',
          prompt: 'A variável <code>n</code> já existe. Com um laço, mostre no console (uma linha por vez) a tabuada de <code>n</code> de 1 a 5, no formato <code>2 x 1 = 2</code>.',
          starter: '// use um for e console.log\n', check: consoleOut, givenVars: ['n'],
          tests: [
            { values: { n: 2 }, expected: ['2 x 1 = 2', '2 x 2 = 4', '2 x 3 = 6', '2 x 4 = 8', '2 x 5 = 10'] },
            { values: { n: 3 }, expected: ['3 x 1 = 3', '3 x 2 = 6', '3 x 3 = 9', '3 x 4 = 12', '3 x 5 = 15'] },
          ],
          solution: 'for (let i = 1; i <= 5; i++) {\n  console.log(n + " x " + i + " = " + n * i);\n}', hint: '<code>console.log(n + " x " + i + " = " + n * i);</code> dentro de um <code>for</code> de 1 a 5.',
        },
      ],
    },
    {
      key: 'js-arrays', lang: 'js', label: 'JavaScript — Arrays (listas)',
      problems: [
        {
          id: 'js-arr-1', level: 1, mode: 'fill', title: 'Primeiro da lista',
          prompt: 'Troque <code>____</code> pela posição do <b>primeiro</b> item da lista.',
          starter: 'function primeiro(lista) {\n  return lista[____];\n}', check: fn('primeiro'), givenVars: [],
          tests: [{ args: [[7, 8, 9]], expected: 7 }, { args: [['a', 'b']], expected: 'a' }],
          solution: 'function primeiro(lista) {\n  return lista[0];\n}', hint: 'A contagem das posições começa no <code>0</code>.',
        },
        {
          id: 'js-arr-2', level: 1, mode: 'fill', title: 'Último da lista',
          prompt: 'Troque <code>____</code> para devolver o <b>último</b> item da lista.',
          starter: 'function ultimo(lista) {\n  return lista[lista.length - ____];\n}', check: fn('ultimo'), givenVars: [],
          tests: [{ args: [[1, 2, 3]], expected: 3 }, { args: [[9]], expected: 9 }],
          solution: 'function ultimo(lista) {\n  return lista[lista.length - 1];\n}', hint: 'A última posição é <code>length - 1</code>.',
        },
        {
          id: 'js-arr-3', level: 1, mode: 'write', title: 'Tamanho da lista',
          prompt: 'Crie a função <code>tamanho(lista)</code> que devolve <b>quantos itens</b> a lista tem.',
          starter: 'function tamanho(lista) {\n  // seu código aqui\n}', check: fn('tamanho'), givenVars: [],
          tests: [{ args: [[1, 2, 3]], expected: 3 }, { args: [[]], expected: 0 }, { args: [['a']], expected: 1 }],
          solution: 'function tamanho(lista) {\n  return lista.length;\n}', hint: 'Toda lista tem a propriedade <code>.length</code>.',
        },
        {
          id: 'js-arr-4', level: 2, mode: 'write', title: 'Soma da lista',
          prompt: 'Crie a função <code>somaLista(lista)</code> que devolve a <b>soma</b> de todos os números da lista.',
          starter: 'function somaLista(lista) {\n  // seu código aqui\n}', check: fn('somaLista'), givenVars: [],
          tests: [{ args: [[1, 2, 3]], expected: 6 }, { args: [[]], expected: 0 }, { args: [[10, -4]], expected: 6 }],
          solution: 'function somaLista(lista) {\n  let total = 0;\n  for (let i = 0; i < lista.length; i++) {\n    total += lista[i];\n  }\n  return total;\n}', hint: 'Percorra com um <code>for</code> somando <code>lista[i]</code>.',
        },
        {
          id: 'js-arr-5', level: 2, mode: 'write', title: 'O maior número',
          prompt: 'Crie a função <code>maiorNumero(lista)</code> que devolve o <b>maior</b> número da lista (a lista nunca vem vazia).',
          starter: 'function maiorNumero(lista) {\n  // seu código aqui\n}', check: fn('maiorNumero'), givenVars: [],
          tests: [{ args: [[3, 9, 2]], expected: 9 }, { args: [[-5, -2, -9]], expected: -2 }, { args: [[4]], expected: 4 }],
          solution: 'function maiorNumero(lista) {\n  let maior = lista[0];\n  for (let i = 1; i < lista.length; i++) {\n    if (lista[i] > maior) {\n      maior = lista[i];\n    }\n  }\n  return maior;\n}', hint: 'Comece com o primeiro item como "maior" e troque quando achar um maior.',
        },
        {
          id: 'js-arr-6', level: 2, mode: 'write', title: 'A lista contém o valor?',
          prompt: 'Crie a função <code>contem(lista, valor)</code> que devolve <code>true</code> se o valor está na lista e <code>false</code> se não está.',
          starter: 'function contem(lista, valor) {\n  // seu código aqui\n}', check: fn('contem'), givenVars: [],
          tests: [{ args: [[1, 2, 3], 2], expected: true }, { args: [[1, 2, 3], 9], expected: false }, { args: [[], 1], expected: false }],
          solution: 'function contem(lista, valor) {\n  return lista.includes(valor);\n}', hint: 'Listas têm o método <code>.includes(valor)</code>.',
        },
        {
          id: 'js-arr-7', level: 3, mode: 'write', title: 'Dobrando a lista',
          prompt: 'Crie a função <code>dobrarLista(lista)</code> que devolve uma <b>nova lista</b> com cada número multiplicado por 2 (ex.: <code>[1, 2, 3]</code> → <code>[2, 4, 6]</code>).',
          starter: 'function dobrarLista(lista) {\n  // seu código aqui\n}', check: fn('dobrarLista'), givenVars: [],
          tests: [{ args: [[1, 2, 3]], expected: [2, 4, 6] }, { args: [[]], expected: [] }, { args: [[5]], expected: [10] }],
          solution: 'function dobrarLista(lista) {\n  return lista.map(function (x) {\n    return x * 2;\n  });\n}', hint: 'Use <code>lista.map(...)</code> ou um <code>for</code> com <code>push</code> numa lista nova.',
        },
        {
          id: 'js-arr-8', level: 3, mode: 'write', title: 'Só os pares',
          prompt: 'Crie a função <code>apenasPares(lista)</code> que devolve uma nova lista só com os números <b>pares</b>, na mesma ordem.',
          starter: 'function apenasPares(lista) {\n  // seu código aqui\n}', check: fn('apenasPares'), givenVars: [],
          tests: [{ args: [[1, 2, 3, 4]], expected: [2, 4] }, { args: [[1, 3]], expected: [] }, { args: [[6, 8, 7]], expected: [6, 8] }],
          solution: 'function apenasPares(lista) {\n  return lista.filter(function (x) {\n    return x % 2 === 0;\n  });\n}', hint: 'Use <code>lista.filter(...)</code> com a condição <code>x % 2 === 0</code>.',
        },
      ],
    },

    // ----------------------------------------------------------------- SQL
    {
      key: 'sql-consultas', lang: 'sql', label: 'SQL — Consultas (SELECT, WHERE, ORDER BY)',
      problems: [
        {
          id: 'sql-sel-1', level: 1, mode: 'fill', title: 'Todas as colunas',
          prompt: 'Troque <code>____</code> para listar <b>todas as colunas</b> da tabela <code>funcionarios</code>.',
          starter: 'SELECT ____ FROM funcionarios;', solution: 'SELECT * FROM funcionarios;',
          hint: 'O asterisco <code>*</code> significa "todas as colunas".',
        },
        {
          id: 'sql-sel-2', level: 1, mode: 'write', title: 'Só algumas colunas',
          prompt: 'Liste apenas o <b>nome</b> e o <b>cargo</b> de todos os funcionários.',
          starter: '-- escreva sua consulta\n', solution: 'SELECT nome, cargo FROM funcionarios;',
          hint: 'Separe as colunas por vírgula: <code>SELECT coluna1, coluna2 FROM tabela;</code>',
        },
        {
          id: 'sql-sel-3', level: 1, mode: 'fill', title: 'Filtrando com WHERE',
          prompt: 'Troque <code>____</code> pela palavra que <b>filtra as linhas</b>: só quem é do departamento 1.',
          starter: 'SELECT nome FROM funcionarios ____ departamento_id = 1;', solution: 'SELECT nome FROM funcionarios WHERE departamento_id = 1;',
          hint: 'O filtro em SQL é o <code>WHERE</code>.',
        },
        {
          id: 'sql-sel-4', level: 2, mode: 'write', title: 'Salários altos',
          prompt: 'Liste o <b>nome</b> e o <b>salário</b> de quem ganha <b>mais de 3000</b>.',
          starter: '-- escreva sua consulta\n', solution: 'SELECT nome, salario FROM funcionarios WHERE salario > 3000;',
          hint: '<code>SELECT ... FROM funcionarios WHERE salario > 3000;</code>',
        },
        {
          id: 'sql-sel-5', level: 2, mode: 'write', title: 'Do maior salário pro menor',
          prompt: 'Liste o <b>nome</b> e o <b>salário</b> de todos, ordenados do <b>maior salário para o menor</b>.',
          starter: '-- escreva sua consulta\n', solution: 'SELECT nome, salario FROM funcionarios ORDER BY salario DESC;', orderMatters: true,
          hint: 'Ordene com <code>ORDER BY coluna DESC</code> (DESC = decrescente).',
        },
        {
          id: 'sql-sel-6', level: 2, mode: 'write', title: 'Equipe do Suporte',
          prompt: 'Liste o <b>nome</b> dos funcionários do departamento <b>2</b> (Suporte).',
          starter: '-- escreva sua consulta\n', solution: 'SELECT nome FROM funcionarios WHERE departamento_id = 2;',
          hint: 'Filtre com <code>WHERE departamento_id = 2</code>.',
        },
      ],
    },
    {
      key: 'sql-alteracao', lang: 'sql', label: 'SQL — Alterando dados (INSERT, UPDATE, DELETE)',
      problems: [
        {
          id: 'sql-alt-1', level: 1, mode: 'fill', title: 'Inserindo um funcionário',
          prompt: 'Troque <code>____</code> pelo nome da tabela para <b>inserir</b> o novo funcionário.',
          starter: "INSERT INTO ____ (id, nome, cargo, departamento_id, salario)\nVALUES (6, 'Bruno Martins', 'Suporte Junior', 2, 2100);",
          solution: "INSERT INTO funcionarios (id, nome, cargo, departamento_id, salario) VALUES (6, 'Bruno Martins', 'Suporte Junior', 2, 2100);",
          verifyQuery: ALL_EMP, hint: 'Os dados vão para a tabela <code>funcionarios</code>.',
        },
        {
          id: 'sql-alt-2', level: 1, mode: 'fill', title: 'Apagando com condição',
          prompt: 'Troque <code>____</code> pela palavra certa para apagar <b>só</b> o funcionário de id 2.',
          starter: 'DELETE FROM funcionarios ____ id = 2;', solution: 'DELETE FROM funcionarios WHERE id = 2;',
          verifyQuery: ALL_EMP, hint: 'Sem <code>WHERE</code> o DELETE apaga tudo! O filtro é o <code>WHERE</code>.',
        },
        {
          id: 'sql-alt-3', level: 2, mode: 'write', title: 'Reajuste de salário',
          prompt: 'Atualize o <b>salário</b> da funcionária de id <b>5</b> para <b>2600</b>.',
          starter: '-- escreva sua atualização\n', solution: 'UPDATE funcionarios SET salario = 2600 WHERE id = 5;',
          verifyQuery: ALL_EMP, hint: '<code>UPDATE tabela SET coluna = valor WHERE ...;</code>',
        },
        {
          id: 'sql-alt-4', level: 2, mode: 'write', title: 'Novo departamento',
          prompt: 'Insira na tabela <code>departamentos</code> o departamento de <b>id 4</b> chamado <b>Financeiro</b>.',
          starter: '-- escreva seu INSERT\n', solution: "INSERT INTO departamentos (id, nome) VALUES (4, 'Financeiro');",
          verifyQuery: 'SELECT * FROM departamentos ORDER BY id;', hint: "<code>INSERT INTO departamentos (id, nome) VALUES (4, 'Financeiro');</code>",
        },
        {
          id: 'sql-alt-5', level: 3, mode: 'write', title: 'Mudando o cargo',
          prompt: 'Atualize o <b>cargo</b> do funcionário de id <b>3</b> para <b>Lider</b> (sem acento).',
          starter: '-- escreva sua atualização\n', solution: "UPDATE funcionarios SET cargo = 'Lider' WHERE id = 3;",
          verifyQuery: ALL_EMP, hint: "Texto em SQL vai entre aspas simples: <code>SET cargo = 'Lider'</code>.",
        },
      ],
    },
    {
      key: 'sql-agregacao', lang: 'sql', label: 'SQL — Agregação (COUNT, SUM, AVG, GROUP BY)',
      problems: [
        {
          id: 'sql-agr-1', level: 1, mode: 'fill', title: 'Quantos funcionários?',
          prompt: 'Troque <code>____</code> pela função que <b>conta</b> as linhas.',
          starter: 'SELECT ____(*) FROM funcionarios;', solution: 'SELECT COUNT(*) FROM funcionarios;',
          hint: 'A função de contagem é <code>COUNT</code>.',
        },
        {
          id: 'sql-agr-2', level: 1, mode: 'write', title: 'Folha de pagamento',
          prompt: 'Mostre a <b>soma</b> de todos os salários.',
          starter: '-- escreva sua consulta\n', solution: 'SELECT SUM(salario) FROM funcionarios;',
          hint: '<code>SELECT SUM(coluna) FROM tabela;</code>',
        },
        {
          id: 'sql-agr-3', level: 2, mode: 'write', title: 'Salário médio',
          prompt: 'Mostre a <b>média</b> dos salários.',
          starter: '-- escreva sua consulta\n', solution: 'SELECT AVG(salario) FROM funcionarios;',
          hint: 'A função da média é <code>AVG</code>.',
        },
        {
          id: 'sql-agr-4', level: 2, mode: 'write', title: 'Maior salário',
          prompt: 'Mostre o <b>maior</b> salário da empresa.',
          starter: '-- escreva sua consulta\n', solution: 'SELECT MAX(salario) FROM funcionarios;',
          hint: 'A função do maior valor é <code>MAX</code>.',
        },
        {
          id: 'sql-agr-5', level: 3, mode: 'write', title: 'Funcionários por departamento',
          prompt: 'Mostre, para cada <code>departamento_id</code>, <b>quantos funcionários</b> ele tem (duas colunas: o departamento e a contagem).',
          starter: '-- escreva sua consulta\n', solution: 'SELECT departamento_id, COUNT(*) FROM funcionarios GROUP BY departamento_id;',
          hint: 'Agrupe com <code>GROUP BY departamento_id</code> e conte com <code>COUNT(*)</code>.',
        },
      ],
    },
    {
      key: 'sql-join', lang: 'sql', label: 'SQL — Juntando tabelas (JOIN)',
      problems: [
        {
          id: 'sql-join-1', level: 2, mode: 'fill', title: 'Ligando as tabelas',
          prompt: 'Troque <code>____</code> pela coluna que <b>liga</b> o funcionário ao departamento dele.',
          starter: 'SELECT funcionarios.nome, departamentos.nome\nFROM funcionarios\nJOIN departamentos ON funcionarios.departamento_id = ____;',
          solution: 'SELECT funcionarios.nome, departamentos.nome FROM funcionarios JOIN departamentos ON funcionarios.departamento_id = departamentos.id;',
          hint: 'O <code>departamento_id</code> do funcionário aponta para o <code>id</code> do departamento: <code>departamentos.id</code>.',
        },
        {
          id: 'sql-join-2', level: 3, mode: 'write', title: 'Funcionário e seu departamento',
          prompt: 'Mostre o <b>nome do funcionário</b> e o <b>nome do departamento</b> dele (nessa ordem), juntando as duas tabelas.',
          starter: '-- escreva sua consulta\n',
          solution: 'SELECT funcionarios.nome, departamentos.nome FROM funcionarios JOIN departamentos ON funcionarios.departamento_id = departamentos.id;',
          hint: '<code>FROM funcionarios JOIN departamentos ON funcionarios.departamento_id = departamentos.id</code>',
        },
        {
          id: 'sql-join-3', level: 3, mode: 'write', title: 'Quem é do Desenvolvimento?',
          prompt: 'Usando <code>JOIN</code>, mostre o <b>nome</b> dos funcionários do departamento chamado <b>Desenvolvimento</b>.',
          starter: '-- escreva sua consulta\n',
          solution: "SELECT funcionarios.nome FROM funcionarios JOIN departamentos ON funcionarios.departamento_id = departamentos.id WHERE departamentos.nome = 'Desenvolvimento';",
          hint: "Faça o JOIN e depois filtre: <code>WHERE departamentos.nome = 'Desenvolvimento'</code>.",
        },
      ],
    },
  ];

  // Junta tópico + problema no formato que vai dentro de quizrush_sessions.questions
  // (tudo o que o aluno precisa está no próprio item — a partida não depende do
  // banco continuar igual depois de criada).
  function toQuestion(topic, p) {
    return Object.assign({ type: 'code', lang: topic.lang, topic: topic.label, givenVars: [] }, p);
  }

  // Sorteia `count` problemas dos assuntos escolhidos, do mais fácil pro mais
  // difícil (dentro do mesmo nível a ordem é aleatória, então cada partida
  // tem uma cara diferente). `rand` existe só pros testes serem determinísticos.
  function pickProblems(topicKeys, count, rand) {
    const random = rand || Math.random;
    const pool = [];
    topics.filter(t => topicKeys.includes(t.key)).forEach(t => t.problems.forEach(p => pool.push(toQuestion(t, p))));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // sort estável (Node/navegadores modernos): mantém o embaralhamento dentro de cada nível
    pool.sort((a, b) => a.level - b.level);
    return pool.slice(0, Math.max(1, count));
  }

  return { topics, toQuestion, pickProblems };
});

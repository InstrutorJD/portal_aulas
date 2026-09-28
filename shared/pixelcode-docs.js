// Documentação em português para o PixelCode (pixelcode.html): aparece
// quando o aluno passa o mouse sobre um comando no editor (Monaco hover).
// Linguagem simples, um exemplo curto e o link do MDN em português.
//
// Chaves de JavaScript:
//   'console.log'  → objeto.membro (vale só depois de "console.")
//   '.push'        → membro de qualquer objeto (ex.: lista.push)
//   'let'          → palavra solta
// HTML: nome da tag ('button') ou atributo ('@id'). CSS: nome da propriedade.
window.PixelCodeDocs = (function () {
  const MDN = 'https://developer.mozilla.org/pt-BR/docs/Web/';
  const JSREF = MDN + 'JavaScript/Reference/';
  const d = (titulo, texto, exemplo, url) => ({ titulo, texto, exemplo, url });

  const js = {
    // Variáveis e estrutura
    'let': d('let', 'Cria uma variável que **pode mudar** de valor depois.', 'let pontos = 0;\npontos = pontos + 10;', JSREF + 'Statements/let'),
    'const': d('const', 'Cria uma **constante**: o valor não pode ser trocado depois.', 'const PI = 3.14;', JSREF + 'Statements/const'),
    'var': d('var', 'Forma antiga de criar variável. Prefira `let` ou `const`.', 'var nome = "Ana";', JSREF + 'Statements/var'),
    'function': d('function', 'Cria uma **função**: um bloco de código com nome, que você chama quando quiser.', 'function somar(a, b) {\n  return a + b;\n}', JSREF + 'Statements/function'),
    'return': d('return', 'Termina a função e **devolve** um valor para quem a chamou.', 'return a + b;', JSREF + 'Statements/return'),
    'if': d('if', 'Executa um bloco **só se** a condição for verdadeira.', 'if (idade >= 18) {\n  console.log("maior de idade");\n}', JSREF + 'Statements/if...else'),
    'else': d('else', 'O caminho de quando a condição do `if` é **falsa**.', 'if (nota >= 6) {\n  console.log("aprovado");\n} else {\n  console.log("recuperação");\n}', JSREF + 'Statements/if...else'),
    'for': d('for', 'Laço que **repete** um bloco um número de vezes.', 'for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}', JSREF + 'Statements/for'),
    'while': d('while', 'Laço que repete **enquanto** a condição for verdadeira. Cuidado com laço infinito!', 'while (vidas > 0) {\n  vidas--;\n}', JSREF + 'Statements/while'),
    'switch': d('switch', 'Escolhe um caminho entre **vários casos**, comparando um valor. Use `break` no fim de cada caso.', 'switch (dia) {\n  case 1: console.log("domingo"); break;\n  default: console.log("outro dia");\n}', JSREF + 'Statements/switch'),
    'break': d('break', 'Sai **na hora** de um laço ou de um `switch`.', 'if (achou) break;', JSREF + 'Statements/break'),
    'continue': d('continue', 'Pula para a **próxima volta** do laço.', 'if (i % 2 === 0) continue;', JSREF + 'Statements/continue'),
    'true': d('true', 'Valor **verdadeiro** (tipo booleano).', 'let ligado = true;', JSREF + 'Global_Objects/Boolean'),
    'false': d('false', 'Valor **falso** (tipo booleano).', 'let ligado = false;', JSREF + 'Global_Objects/Boolean'),
    'null': d('null', 'Representa "**sem valor**" de propósito.', 'let jogador = null;', JSREF + 'Operators/null'),
    'undefined': d('undefined', 'Valor de uma variável que ainda **não recebeu** nada.', 'let x;\nconsole.log(x); // undefined', JSREF + 'Global_Objects/undefined'),
    'new': d('new', 'Cria um **objeto novo** a partir de uma classe.', 'const hoje = new Date();', JSREF + 'Operators/new'),
    'class': d('class', 'Cria uma **classe**: um molde para criar objetos com dados e métodos.', 'class Jogador {\n  constructor(nome) { this.nome = nome; }\n}', JSREF + 'Statements/class'),
    'this': d('this', 'Se refere ao **objeto atual** (dentro de um método ou classe).', 'this.nome = nome;', JSREF + 'Operators/this'),
    'try': d('try', 'Tenta executar um código e, se der **erro**, cai no `catch` em vez de parar tudo.', 'try {\n  JSON.parse(texto);\n} catch (erro) {\n  console.log("texto inválido");\n}', JSREF + 'Statements/try...catch'),
    'async': d('async', 'Marca uma função **assíncrona**, que pode usar `await`.', 'async function carregar() { ... }', JSREF + 'Statements/async_function'),
    'await': d('await', '**Espera** uma operação demorada (como `fetch`) terminar antes de seguir.', 'const resposta = await fetch(url);', JSREF + 'Operators/await'),
    // Saída e entrada
    'console.log': d('console.log()', 'Mostra um valor no **console** (aqui embaixo do navegador). Ótimo para testar e achar erros.', 'console.log("pontos:", pontos);', MDN + 'API/console/log_static'),
    'console.error': d('console.error()', 'Mostra uma mensagem de **erro** no console (em vermelho).', 'console.error("algo deu errado");', MDN + 'API/console/error_static'),
    'console.warn': d('console.warn()', 'Mostra um **aviso** no console (em amarelo).', 'console.warn("cuidado");', MDN + 'API/console/warn_static'),
    'alert': d('alert()', 'Abre uma **caixa de mensagem** na tela.', 'alert("Bem-vindo!");', MDN + 'API/Window/alert'),
    'prompt': d('prompt()', 'Abre uma caixa para o usuário **digitar** algo. Devolve sempre um texto.', 'const nome = prompt("Seu nome?");', MDN + 'API/Window/prompt'),
    'confirm': d('confirm()', 'Pergunta com botões OK e Cancelar. Devolve `true` ou `false`.', 'if (confirm("Apagar?")) { ... }', MDN + 'API/Window/confirm'),
    // Conversão e números
    'parseInt': d('parseInt()', 'Converte um texto em **número inteiro**.', 'parseInt("42"); // 42', JSREF + 'Global_Objects/parseInt'),
    'parseFloat': d('parseFloat()', 'Converte um texto em **número com vírgula** (decimal).', 'parseFloat("3.5"); // 3.5', JSREF + 'Global_Objects/parseFloat'),
    'Number': d('Number()', 'Converte um valor em **número**.', 'Number("10") + 5; // 15', JSREF + 'Global_Objects/Number'),
    'String': d('String()', 'Converte um valor em **texto**.', 'String(10) + 5; // "105"', JSREF + 'Global_Objects/String'),
    'isNaN': d('isNaN()', 'Diz se um valor **não é um número** válido.', 'isNaN("abc"); // true', JSREF + 'Global_Objects/isNaN'),
    '.toFixed': d('.toFixed()', 'Formata um número com uma **quantidade fixa de casas decimais**. Devolve texto.', '(9.456).toFixed(2); // "9.46"', JSREF + 'Global_Objects/Number/toFixed'),
    'Math.random': d('Math.random()', 'Sorteia um número **aleatório** entre 0 (incluído) e 1 (não incluído).', 'const dado = Math.floor(Math.random() * 6) + 1;', JSREF + 'Global_Objects/Math/random'),
    'Math.floor': d('Math.floor()', 'Arredonda **para baixo**.', 'Math.floor(4.9); // 4', JSREF + 'Global_Objects/Math/floor'),
    'Math.ceil': d('Math.ceil()', 'Arredonda **para cima**.', 'Math.ceil(4.1); // 5', JSREF + 'Global_Objects/Math/ceil'),
    'Math.round': d('Math.round()', 'Arredonda para o inteiro **mais próximo**.', 'Math.round(4.5); // 5', JSREF + 'Global_Objects/Math/round'),
    'Math.max': d('Math.max()', 'Devolve o **maior** número.', 'Math.max(3, 9, 2); // 9', JSREF + 'Global_Objects/Math/max'),
    'Math.min': d('Math.min()', 'Devolve o **menor** número.', 'Math.min(3, 9, 2); // 2', JSREF + 'Global_Objects/Math/min'),
    'Math.abs': d('Math.abs()', 'Devolve o valor **sem sinal** (absoluto).', 'Math.abs(-7); // 7', JSREF + 'Global_Objects/Math/abs'),
    'Math.sqrt': d('Math.sqrt()', 'Calcula a **raiz quadrada**.', 'Math.sqrt(16); // 4', JSREF + 'Global_Objects/Math/sqrt'),
    'Math.pow': d('Math.pow()', 'Calcula a **potência** (base elevada ao expoente). Também dá para usar `**`.', 'Math.pow(2, 3); // 8', JSREF + 'Global_Objects/Math/pow'),
    // Texto e listas
    '.length': d('.length', 'Quantidade de **itens** de uma lista ou de **caracteres** de um texto.', '"casa".length; // 4\n[1, 2, 3].length; // 3', JSREF + 'Global_Objects/Array/length'),
    '.push': d('.push()', '**Adiciona** um item no fim da lista.', 'const frutas = ["maçã"];\nfrutas.push("uva");', JSREF + 'Global_Objects/Array/push'),
    '.pop': d('.pop()', '**Remove** o último item da lista e o devolve.', 'const ultimo = frutas.pop();', JSREF + 'Global_Objects/Array/pop'),
    '.shift': d('.shift()', 'Remove o **primeiro** item da lista.', 'fila.shift();', JSREF + 'Global_Objects/Array/shift'),
    '.unshift': d('.unshift()', 'Adiciona um item no **começo** da lista.', 'fila.unshift("novo");', JSREF + 'Global_Objects/Array/unshift'),
    '.includes': d('.includes()', 'Diz se a lista ou o texto **contém** um valor (`true`/`false`).', '["a", "b"].includes("b"); // true', JSREF + 'Global_Objects/Array/includes'),
    '.indexOf': d('.indexOf()', 'Devolve a **posição** do valor na lista ou no texto (ou -1 se não achar).', '["a", "b"].indexOf("b"); // 1', JSREF + 'Global_Objects/Array/indexOf'),
    '.forEach': d('.forEach()', 'Executa uma função **para cada item** da lista.', 'nomes.forEach(nome => console.log(nome));', JSREF + 'Global_Objects/Array/forEach'),
    '.map': d('.map()', 'Cria uma **lista nova** transformando cada item.', 'const dobro = [1, 2].map(n => n * 2); // [2, 4]', JSREF + 'Global_Objects/Array/map'),
    '.filter': d('.filter()', 'Cria uma lista só com os itens que **passam num teste**.', 'const pares = numeros.filter(n => n % 2 === 0);', JSREF + 'Global_Objects/Array/filter'),
    '.find': d('.find()', 'Devolve o **primeiro item** que passa no teste.', 'const ana = alunos.find(a => a.nome === "Ana");', JSREF + 'Global_Objects/Array/find'),
    '.reduce': d('.reduce()', 'Junta todos os itens em **um valor só** (ex.: soma).', 'const total = [1, 2, 3].reduce((s, n) => s + n, 0); // 6', JSREF + 'Global_Objects/Array/reduce'),
    '.sort': d('.sort()', '**Ordena** a lista. Para números, passe uma função de comparação.', 'numeros.sort((a, b) => a - b);', JSREF + 'Global_Objects/Array/sort'),
    '.join': d('.join()', 'Junta os itens da lista num **texto**, com um separador.', '["a", "b"].join(", "); // "a, b"', JSREF + 'Global_Objects/Array/join'),
    '.split': d('.split()', '**Quebra** um texto numa lista, usando um separador.', '"a,b,c".split(","); // ["a", "b", "c"]', JSREF + 'Global_Objects/String/split'),
    '.slice': d('.slice()', 'Pega um **pedaço** da lista ou do texto, sem mudar o original.', '"PixelCode".slice(0, 5); // "Pixel"', JSREF + 'Global_Objects/Array/slice'),
    '.toUpperCase': d('.toUpperCase()', 'Deixa o texto em **MAIÚSCULAS**.', '"ana".toUpperCase(); // "ANA"', JSREF + 'Global_Objects/String/toUpperCase'),
    '.toLowerCase': d('.toLowerCase()', 'Deixa o texto em **minúsculas**.', '"ANA".toLowerCase(); // "ana"', JSREF + 'Global_Objects/String/toLowerCase'),
    '.trim': d('.trim()', 'Tira os **espaços** do começo e do fim do texto.', '"  oi  ".trim(); // "oi"', JSREF + 'Global_Objects/String/trim'),
    '.replace': d('.replace()', '**Troca** um pedaço do texto por outro.', '"bom dia".replace("dia", "noite");', JSREF + 'Global_Objects/String/replace'),
    'JSON.stringify': d('JSON.stringify()', 'Transforma um objeto em **texto JSON** (para salvar ou enviar).', 'JSON.stringify({ nome: "Ana" }); // \'{"nome":"Ana"}\'', JSREF + 'Global_Objects/JSON/stringify'),
    'JSON.parse': d('JSON.parse()', 'Transforma um **texto JSON** de volta em objeto.', 'const obj = JSON.parse(\'{"nome":"Ana"}\');', JSREF + 'Global_Objects/JSON/parse'),
    // Página (DOM)
    'document.getElementById': d('document.getElementById()', '**Pega um elemento** da página pelo `id` dele.', '<button id="botao">…</button>\nconst botao = document.getElementById("botao");', MDN + 'API/Document/getElementById'),
    'document.querySelector': d('document.querySelector()', 'Pega o **primeiro elemento** que combina com um seletor CSS (`#id`, `.classe`, `tag`).', 'const titulo = document.querySelector("h1");', MDN + 'API/Document/querySelector'),
    'document.querySelectorAll': d('document.querySelectorAll()', 'Pega **todos os elementos** que combinam com um seletor CSS.', 'document.querySelectorAll(".item").forEach(el => …);', MDN + 'API/Document/querySelectorAll'),
    'document.createElement': d('document.createElement()', 'Cria um **elemento novo** (ainda fora da página; use `appendChild` para colocar).', 'const li = document.createElement("li");', MDN + 'API/Document/createElement'),
    '.appendChild': d('.appendChild()', '**Coloca** um elemento dentro de outro, no fim.', 'lista.appendChild(li);', MDN + 'API/Node/appendChild'),
    '.remove': d('.remove()', '**Tira** o elemento da página.', 'aviso.remove();', 'https://developer.mozilla.org/en-US/docs/Web/API/Element/remove'),
    '.addEventListener': d('.addEventListener()', 'Manda o elemento **"escutar" um evento** (clique, tecla...) e rodar uma função quando ele acontecer.', 'botao.addEventListener("click", () => {\n  console.log("clicou!");\n});', MDN + 'API/EventTarget/addEventListener'),
    '.textContent': d('.textContent', 'O **texto** dentro de um elemento. Dá para ler ou trocar.', 'titulo.textContent = "Novo título";', MDN + 'API/Node/textContent'),
    '.innerHTML': d('.innerHTML', 'O **HTML** dentro de um elemento. Cuidado: não use com texto digitado pelo usuário.', 'caixa.innerHTML = "<b>Oi</b>";', MDN + 'API/Element/innerHTML'),
    '.value': d('.value', 'O **valor digitado** num campo (`input`, `select`, `textarea`). Sempre vem como texto.', 'const nome = campoNome.value;', 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/value'),
    '.style': d('.style', 'Muda o **estilo CSS** direto no elemento.', 'caixa.style.backgroundColor = "yellow";', 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style'),
    '.classList': d('.classList', 'Lista de **classes CSS** do elemento: `add`, `remove`, `toggle`.', 'menu.classList.toggle("aberto");', MDN + 'API/Element/classList'),
    '.setAttribute': d('.setAttribute()', 'Define um **atributo** do elemento.', 'img.setAttribute("src", "foto.png");', MDN + 'API/Element/setAttribute'),
    '.preventDefault': d('.preventDefault()', 'Cancela o **comportamento padrão** do evento (ex.: o formulário recarregar a página).', 'form.addEventListener("submit", e => {\n  e.preventDefault();\n});', MDN + 'API/Event/preventDefault'),
    // Tempo e rede
    'setTimeout': d('setTimeout()', 'Executa uma função **uma vez**, depois de alguns milissegundos.', 'setTimeout(() => console.log("1 segundo depois"), 1000);', 'https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout'),
    'setInterval': d('setInterval()', 'Executa uma função **repetidamente**, a cada intervalo.', 'const relogio = setInterval(atualizar, 1000);', MDN + 'API/Window/setInterval'),
    'clearInterval': d('clearInterval()', '**Para** um `setInterval`.', 'clearInterval(relogio);', 'https://developer.mozilla.org/en-US/docs/Web/API/Window/clearInterval'),
    'fetch': d('fetch()', 'Faz um **pedido pela internet** (a uma API) e devolve a resposta. Use com `await`.', 'const resp = await fetch("https://viacep.com.br/ws/01001000/json/");\nconst dados = await resp.json();', MDN + 'API/Window/fetch'),
    'localStorage.setItem': d('localStorage.setItem()', '**Guarda** um texto no navegador, que continua lá ao recarregar a página.', 'localStorage.setItem("recorde", "120");', MDN + 'API/Window/localStorage'),
    'localStorage.getItem': d('localStorage.getItem()', '**Lê** um texto guardado no navegador.', 'const recorde = localStorage.getItem("recorde");', MDN + 'API/Window/localStorage'),
  };

  const html = {
    'html': d('<html>', 'A **raiz** da página: tudo fica dentro dela.', '<html lang="pt-BR"> … </html>', MDN + 'HTML/Element/html'),
    'head': d('<head>', 'Informações **sobre** a página (título, CSS). Não aparece na tela.', '<head><title>Minha página</title></head>', MDN + 'HTML/Element/head'),
    'body': d('<body>', 'O **conteúdo visível** da página.', '<body> … </body>', MDN + 'HTML/Element/body'),
    'title': d('<title>', 'O **título** que aparece na aba do navegador.', '<title>Meu jogo</title>', MDN + 'HTML/Element/title'),
    'h1': d('<h1> a <h6>', '**Títulos**, do mais importante (h1) ao menos importante (h6).', '<h1>Título principal</h1>\n<h2>Subtítulo</h2>', MDN + 'HTML/Element/Heading_Elements'),
    'p': d('<p>', 'Um **parágrafo** de texto.', '<p>Olá, mundo!</p>', MDN + 'HTML/Element/p'),
    'a': d('<a>', 'Um **link**. O endereço vai no atributo `href`.', '<a href="https://senai.br">Site do SENAI</a>', MDN + 'HTML/Element/a'),
    'img': d('<img>', 'Uma **imagem**. Use `src` (endereço) e `alt` (descrição para quem não enxerga).', '<img src="https://…/foto.png" alt="Foto da turma">', MDN + 'HTML/Element/img'),
    'button': d('<button>', 'Um **botão** clicável.', '<button id="jogar">Jogar</button>', MDN + 'HTML/Element/button'),
    'input': d('<input>', 'Um **campo** para o usuário digitar ou escolher. O tipo vai em `type`.', '<input type="text" id="nome" placeholder="Seu nome">', MDN + 'HTML/Element/input'),
    'label': d('<label>', 'O **rótulo** de um campo. Ligue com `for` igual ao `id` do campo.', '<label for="nome">Nome</label>', MDN + 'HTML/Element/label'),
    'form': d('<form>', 'Um **formulário**: agrupa campos e o botão de enviar.', '<form id="cadastro"> … </form>', 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form'),
    'select': d('<select>', 'Uma **lista de opções** para escolher (com `<option>`).', '<select><option>SP</option></select>', MDN + 'HTML/Element/select'),
    'option': d('<option>', 'Uma **opção** dentro de um `<select>`.', '<option value="sp">São Paulo</option>', MDN + 'HTML/Element/option'),
    'textarea': d('<textarea>', 'Um **campo de texto grande**, com várias linhas.', '<textarea rows="4"></textarea>', MDN + 'HTML/Element/textarea'),
    'div': d('<div>', 'Uma **caixa** genérica para agrupar elementos e aplicar CSS.', '<div class="cartao"> … </div>', MDN + 'HTML/Element/div'),
    'span': d('<span>', 'Um **trecho** de texto, para destacar ou estilizar uma parte da linha.', '<p>Pontos: <span id="pontos">0</span></p>', MDN + 'HTML/Element/span'),
    'ul': d('<ul>', 'Uma **lista com marcadores** (itens com `<li>`).', '<ul><li>Arroz</li><li>Feijão</li></ul>', MDN + 'HTML/Element/ul'),
    'ol': d('<ol>', 'Uma **lista numerada** (itens com `<li>`).', '<ol><li>Primeiro</li></ol>', MDN + 'HTML/Element/ol'),
    'li': d('<li>', 'Um **item** de lista.', '<li>Item</li>', MDN + 'HTML/Element/li'),
    'table': d('<table>', 'Uma **tabela** (linhas `<tr>`, células `<td>`, cabeçalho `<th>`).', '<table><tr><th>Nome</th></tr><tr><td>Ana</td></tr></table>', MDN + 'HTML/Element/table'),
    'tr': d('<tr>', 'Uma **linha** da tabela.', '<tr><td>Ana</td><td>9</td></tr>', 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/tr'),
    'td': d('<td>', 'Uma **célula** da tabela.', '<td>Ana</td>', 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/td'),
    'th': d('<th>', 'Uma **célula de cabeçalho** da tabela (em negrito).', '<th>Nome</th>', MDN + 'HTML/Element/th'),
    'header': d('<header>', 'O **cabeçalho** da página ou de uma seção.', '<header><h1>Meu site</h1></header>', MDN + 'HTML/Element/header'),
    'nav': d('<nav>', 'A área de **menu/navegação**.', '<nav><a href="#inicio">Início</a></nav>', MDN + 'HTML/Element/nav'),
    'main': d('<main>', 'O **conteúdo principal** da página (só um por página).', '<main> … </main>', MDN + 'HTML/Element/main'),
    'section': d('<section>', 'Uma **seção** de conteúdo com um tema.', '<section><h2>Sobre</h2> … </section>', MDN + 'HTML/Element/section'),
    'footer': d('<footer>', 'O **rodapé** da página ou da seção.', '<footer>© 2026</footer>', MDN + 'HTML/Element/footer'),
    'strong': d('<strong>', 'Texto **importante** (aparece em negrito).', '<strong>Atenção!</strong>', MDN + 'HTML/Element/strong'),
    'em': d('<em>', 'Texto com **ênfase** (aparece em itálico).', '<em>muito</em>', MDN + 'HTML/Element/em'),
    'br': d('<br>', '**Quebra de linha**.', 'Linha 1<br>Linha 2', MDN + 'HTML/Element/br'),
    'canvas': d('<canvas>', 'Uma **área de desenho** controlada pelo JavaScript (jogos, gráficos).', '<canvas id="tela" width="400" height="300"></canvas>', MDN + 'HTML/Element/canvas'),
    'script': d('<script>', 'Coloca **JavaScript** na página. No PixelCode, use a aba JS.', '<script> … </script>', MDN + 'HTML/Element/script'),
    'style': d('<style>', 'Coloca **CSS** na página. No PixelCode, use a aba CSS.', '<style> … </style>', MDN + 'HTML/Element/style'),
    '@id': d('id="..."', '**Nome único** do elemento na página. Usado pelo JS (`getElementById`) e pelo CSS (`#nome`).', '<button id="jogar">', MDN + 'HTML/Global_attributes/id'),
    '@class': d('class="..."', '**Classe** do elemento: vários elementos podem ter a mesma. Usada pelo CSS (`.nome`).', '<div class="cartao destaque">', MDN + 'HTML/Global_attributes/class'),
    '@href': d('href="..."', '**Endereço** para onde o link leva.', '<a href="https://senai.br">', MDN + 'HTML/Element/a#href'),
    '@src': d('src="..."', '**Endereço** do arquivo (imagem, script).', '<img src="https://…/logo.png">', MDN + 'HTML/Element/img#src'),
    '@alt': d('alt="..."', '**Descrição** da imagem para quem usa leitor de tela (acessibilidade).', '<img alt="Logo da escola">', MDN + 'HTML/Element/img#alt'),
    '@type': d('type="..."', '**Tipo** do campo ou botão (text, number, email, password, checkbox, submit...).', '<input type="number">', MDN + 'HTML/Element/input#input_types'),
    '@placeholder': d('placeholder="..."', 'Texto de **dica** que aparece no campo vazio.', '<input placeholder="Digite seu nome">', MDN + 'HTML/Element/input#placeholder'),
    '@value': d('value="..."', 'O **valor** do campo ou da opção.', '<option value="sp">', MDN + 'HTML/Element/input#value'),
  };

  const CSSREF = MDN + 'CSS/';
  const css = {
    'color': d('color', 'A **cor do texto**.', 'color: #333;', CSSREF + 'color'),
    'background-color': d('background-color', 'A **cor de fundo**.', 'background-color: lightblue;', CSSREF + 'background-color'),
    'background': d('background', 'Atalho para o **fundo**: cor, imagem, gradiente.', 'background: linear-gradient(#fff, #ccc);', CSSREF + 'background'),
    'font-size': d('font-size', 'O **tamanho da letra**.', 'font-size: 18px;', CSSREF + 'font-size'),
    'font-family': d('font-family', 'O **tipo de letra** (fonte).', 'font-family: Arial, sans-serif;', CSSREF + 'font-family'),
    'font-weight': d('font-weight', 'A **grossura** da letra (normal, bold, 700...).', 'font-weight: bold;', CSSREF + 'font-weight'),
    'text-align': d('text-align', '**Alinhamento** do texto (left, center, right).', 'text-align: center;', CSSREF + 'text-align'),
    'margin': d('margin', 'Espaço **por fora** do elemento (afasta dos vizinhos).', 'margin: 10px 20px;', CSSREF + 'margin'),
    'padding': d('padding', 'Espaço **por dentro** do elemento (entre a borda e o conteúdo).', 'padding: 12px;', CSSREF + 'padding'),
    'border': d('border', 'A **borda**: espessura, estilo e cor.', 'border: 2px solid black;', 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border'),
    'border-radius': d('border-radius', 'Deixa os **cantos arredondados**.', 'border-radius: 8px;', 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-radius'),
    'width': d('width', 'A **largura** do elemento.', 'width: 300px;', CSSREF + 'width'),
    'height': d('height', 'A **altura** do elemento.', 'height: 200px;', CSSREF + 'height'),
    'display': d('display', 'Como o elemento **se comporta** no layout: block, inline, flex, grid, none (esconde).', 'display: flex;', CSSREF + 'display'),
    'flex-direction': d('flex-direction', 'No flex, a **direção** dos itens: row (linha) ou column (coluna).', 'flex-direction: column;', CSSREF + 'flex-direction'),
    'justify-content': d('justify-content', 'No flex/grid, **distribui** os itens no eixo principal.', 'justify-content: space-between;', 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/justify-content'),
    'align-items': d('align-items', 'No flex/grid, **alinha** os itens no outro eixo.', 'align-items: center;', CSSREF + 'align-items'),
    'gap': d('gap', '**Espaço entre** os itens do flex/grid.', 'gap: 10px;', CSSREF + 'gap'),
    'grid-template-columns': d('grid-template-columns', 'No grid, define as **colunas**.', 'grid-template-columns: 1fr 1fr 1fr;', CSSREF + 'grid-template-columns'),
    'position': d('position', 'Como o elemento é **posicionado**: static, relative, absolute, fixed.', 'position: absolute;\ntop: 10px;', CSSREF + 'position'),
    'top': d('top', 'Distância **do topo** (com `position`).', 'top: 0;', 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/top'),
    'left': d('left', 'Distância **da esquerda** (com `position`).', 'left: 50%;', 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/left'),
    'z-index': d('z-index', 'Quem fica **na frente** quando elementos se sobrepõem (maior = mais na frente).', 'z-index: 10;', 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/z-index'),
    'cursor': d('cursor', 'O **formato do mouse** sobre o elemento.', 'cursor: pointer;', CSSREF + 'cursor'),
    'opacity': d('opacity', 'A **transparência** (0 = invisível, 1 = normal).', 'opacity: 0.5;', CSSREF + 'opacity'),
    'box-shadow': d('box-shadow', 'Uma **sombra** em volta da caixa.', 'box-shadow: 0 4px 10px rgba(0,0,0,0.3);', CSSREF + 'box-shadow'),
    'transition': d('transition', 'Faz a mudança de estilo acontecer **suavemente**, com animação.', 'transition: background-color 0.3s;', CSSREF + 'transition'),
    'transform': d('transform', '**Gira, aumenta ou move** o elemento.', 'transform: scale(1.1) rotate(5deg);', CSSREF + 'transform'),
    'overflow': d('overflow', 'O que fazer quando o conteúdo **não cabe**: visible, hidden, auto (rolagem).', 'overflow: auto;', CSSREF + 'overflow'),
    'line-height': d('line-height', 'A **altura da linha** (espaço entre as linhas do texto).', 'line-height: 1.6;', 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-height'),
    'text-decoration': d('text-decoration', 'Sublinhado ou riscado do texto (`none` tira o sublinhado dos links).', 'text-decoration: none;', CSSREF + 'text-decoration'),
    'max-width': d('max-width', 'A **largura máxima**: o elemento não passa disso.', 'max-width: 800px;', CSSREF + 'max-width'),
  };

  function markdown(doc) {
    return [
      // Título como código: o Monaco apaga tags HTML soltas (ex.: <button>).
      { value: `**\`${doc.titulo}\`** · _explicação em português_` },
      { value: doc.texto },
      { value: '```' + (doc.lang || 'javascript') + '\n' + doc.exemplo + '\n```' },
      // Algumas páginas do MDN ainda não têm tradução: aí o link vai para a versão em inglês.
      { value: `[📖 Ver no MDN (${doc.url.includes('/pt-BR/') ? 'em português' : 'em inglês'})](${doc.url})` },
    ];
  }

  // JavaScript: acha o nome sob o mouse e o objeto antes do ponto (se houver).
  function buscarJs(model, position) {
    const w = model.getWordAtPosition(position);
    if (!w) return null;
    const linha = model.getLineContent(position.lineNumber);
    const antes = linha.slice(0, w.startColumn - 1);
    const objeto = (antes.match(/([A-Za-z_$][\w$]*)\s*\.\s*$/) || [])[1];
    const temPonto = /\.\s*$/.test(antes);
    const doc = (objeto && js[`${objeto}.${w.word}`]) || (temPonto && js[`.${w.word}`]) || (!temPonto && js[w.word]);
    return doc ? { doc, w } : null;
  }

  // HTML: nome de tag logo depois de "<" ou "</", ou nome de atributo seguido de "=".
  function buscarHtml(model, position) {
    const w = model.getWordAtPosition(position);
    if (!w) return null;
    const linha = model.getLineContent(position.lineNumber);
    const antes = linha.slice(0, w.startColumn - 1);
    const depois = linha.slice(w.endColumn - 1);
    const nome = w.word.toLowerCase();
    if (/<\/?\s*$/.test(antes)) {
      const chave = /^h[1-6]$/.test(nome) ? 'h1' : nome;
      return html[chave] ? { doc: Object.assign({ lang: 'html' }, html[chave]), w } : null;
    }
    if (/^\s*=/.test(depois) && /<[a-z][^>]*$/i.test(antes)) {
      const doc = html[`@${nome}`];
      return doc ? { doc: Object.assign({ lang: 'html' }, doc), w } : null;
    }
    return null;
  }

  // CSS: nome de propriedade seguido de ":". A "palavra" do Monaco para
  // pelo hífen, então junta o nome inteiro a partir da coluna do mouse.
  function buscarCss(model, position) {
    const linha = model.getLineContent(position.lineNumber);
    const i = position.column - 1;
    const re = /([a-z-]+)\s*:/gi;
    let m;
    while ((m = re.exec(linha))) {
      if (i >= m.index && i <= m.index + m[1].length) {
        const doc = css[m[1].toLowerCase()];
        if (!doc) return null;
        return { doc: Object.assign({ lang: 'css' }, doc), w: { startColumn: m.index + 1, endColumn: m.index + m[1].length + 1 } };
      }
    }
    return null;
  }

  // O Monaco mostra primeiro o balão do provedor registrado POR ÚLTIMO. Os
  // provedores dele (em inglês) só são registrados quando a linguagem termina
  // de carregar — por isso o PixelCode chama registrar() depois disso.
  function registrar(monaco) {
    const provedor = busca => ({
      provideHover(model, position) {
        const r = busca(model, position);
        if (!r) return null;
        return {
          range: new monaco.Range(position.lineNumber, r.w.startColumn, position.lineNumber, r.w.endColumn),
          contents: markdown(r.doc),
        };
      },
    });
    monaco.languages.registerHoverProvider('javascript', provedor(buscarJs));
    monaco.languages.registerHoverProvider('html', provedor(buscarHtml));
    monaco.languages.registerHoverProvider('css', provedor(buscarCss));
  }

  return { registrar, js, html, css };
})();

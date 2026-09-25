---
aula: 3
data: 2026-10-02
titulo: HTML, CSS e JavaScript: a tela da comanda
turma: IA
descricao: Estrutura, apresentação e comportamento; tela da comanda com Copilot e correção pelo console
---

# A comanda ganha uma tela
Aula 3: HTML, CSS e JavaScript com a IA ao lado

---

## Desafio: hackeie um site (de mentira)
1. Abra um site de notícias
2. Aperte **F12** e vá na aba **Elementos**
3. Dê dois cliques num título e **troque o texto**
4. Tire um print da sua "manchete"

[cronômetro 5]

---

## O que você acabou de fazer?
+ Você mexeu no **HTML** da página, a estrutura dela
+ A mudança só existe **no seu navegador**: o site não mudou
+ Aperte **F5** e tudo volta ao normal
+ Hoje você vai criar uma página **do zero**, com a IA ao lado

---

## Termômetro: levante os dedos
**0** nunca ouvi · **1** já ouvi · **2** sei explicar · **3** já usei

+ HTML
+ CSS
+ JavaScript
+ Variável e lista
+ Função e condição
+ Evento e console

---

## Retomada da Aula 2
Qual destes é um JSON válido?

- [ ] `{ mesa: 12 }`
- [x] `{ "mesa": 12 }`
- [ ] `{ "mesa": 12, }`
- [ ] `{ 'mesa': 12 }`

---

## Retomada da Aula 2
Para adicionar um item na comanda 7, a rota do nosso plano é...

- [ ] `GET /comandas/7`
- [ ] `DELETE /comandas/7`
- [x] `PATCH /comandas/7`
- [ ] `POST /comandas`

---

## Roteiro de hoje (4h)
1. HTML, CSS e JavaScript: quem faz o quê (20 min)
2. A lógica do script: variável, lista, função, condição e evento (30 min)
3. Mão na massa: a tela da comanda com o Copilot (190 min)

---

# Parte 1 — Três linguagens, três papéis
Estrutura, apresentação e comportamento

---

## Uma casa
| Na casa | Na página | Linguagem |
|---|---|---|
| Paredes e cômodos | O que existe na tela | **HTML**: estrutura |
| Pintura e decoração | Cores, tamanhos, posição | **CSS**: apresentação |
| Eletricidade | O que acontece ao clicar | **JavaScript**: comportamento |

---

## A tela que vamos construir
```
┌──────────────────────────────┐
│  Comanda — Mesa 12           │
│  Item:  [ X-Burger       ]   │
│  Preço: [ 22.00 ]            │
│  [        Adicionar        ] │
│  • X-Burger ....... R$ 22.00 │
│  • Suco ........... R$  8.50 │
│  Total: R$ 30.50             │
└──────────────────────────────┘
```

---

## HTML: a estrutura
```html
<main class="comanda">
  <h1>Comanda — Mesa 12</h1>
  <input id="nome" placeholder="Item">
  <input id="preco" type="number" placeholder="Preço">
  <button id="btnAdicionar">Adicionar</button>
  <ul id="lista"></ul>
  <p>Total: R$ <span id="total">0.00</span></p>
</main>
<script src="script.js"></script>
```

O `id` é o nome que o JavaScript usa para achar cada peça.

---

## CSS: a apresentação
```css
.comanda {
  max-width: 480px;   /* no computador, não estica */
  margin: 0 auto;     /* centraliza na tela */
  padding: 16px;
}
button { width: 100%; padding: 12px; }

@media (min-width: 768px) {   /* telas maiores */
  .comanda { padding: 32px; }
}
```

---

## Responsivo: o celular do garçom
+ **Responsivo**: a mesma página se ajusta a qualquer tela
+ Comece pelo **celular** e depois ajuste para telas maiores
+ `@media` aplica regras só a partir de uma largura
+ No HTML, a linha `<meta name="viewport" ...>` é obrigatória

> Lembra do RNF "funcionar no celular do garçom"? É isto.

---

## Quem faz o quê?
O botão "Adicionar" precisa ficar verde. Em qual arquivo você mexe?

- [ ] `index.html`
- [x] `style.css`
- [ ] `script.js`
- [ ] `comanda.json`

---

# Parte 2 — A lógica do script
Variável, lista, função, condição e evento

---

## Variável: uma caixa com nome
```js
let total = 0;        // let: o valor pode mudar
const mesa = 12;      // const: o valor não muda

total = total + 22;   // agora total vale 22
console.log(total);   // mostra 22 no console
```

---

## Lista: vários valores em ordem
```js
const itens = ["X-Burger", "Suco"];

itens.push("Batata");       // adiciona no fim
console.log(itens.length);  // 3
console.log(itens[0]);      // "X-Burger": começa do 0
```

---

## Função: uma receita com nome
```js
function somar(a, b) {
  return a + b;
}

console.log(somar(22, 8.5));   // 30.5
```

Escreva uma vez, use quantas vezes quiser.

---

## Condição: se... senão...
```js
const preco = 0;

if (preco <= 0) {
  alert("Preço inválido");
} else {
  console.log("Item adicionado");
}
```

---

## Evento: quando algo acontece
```js
const botao = document.getElementById("btnAdicionar");

botao.addEventListener("click", () => {
  console.log("Clicou em Adicionar!");
});
```

O código **espera** o clique. Só então ele roda.

---

## Cuidado com o texto
O campo de preço tem `"22"`. Quanto dá `"22" + 8.5`?

- [ ] `30.5`
- [x] `"228.5"`
- [ ] Um erro no console
- [ ] `NaN`

---

## Por que "228.5"?
+ Tudo o que vem de um campo `<input>` chega como **texto**
+ Texto `+` número **junta** em vez de somar
+ A correção: `Number("22") + 8.5` dá `30.5`
+ Guarde isso: é um erro que **a IA também comete**

---

## Qual é qual?
"Quando o garçom tocar em Adicionar, some o preço ao total." A parte "quando tocar" é...

- [ ] Uma variável
- [ ] Uma lista
- [ ] Uma condição
- [x] Um evento

---

# Parte 3 — Mão na massa
A tela da comanda com o Copilot

---

## Regras do jogo
+ **Um arquivo por vez**: HTML, depois CSS, depois JavaScript
+ Prompt com **contexto, tarefa e formato**
+ Lembre: são **50 mensagens de chat por mês**
+ Tudo o que a IA gerar, você **lê, testa e comenta**

---

## Preparando o projeto
1. Abra o Codespace do `sistema-comandas`
2. Crie a pasta `tela` e, dentro dela, os 3 arquivos
3. No terminal: `cd tela` e depois `python3 -m http.server 8000`
4. Na aba **PORTAS**, abra a porta **8000** no navegador

[cronômetro 10]

---

## Prompt 1: o HTML
> Estou criando um Sistema de Comandas para o celular do garçom. Crie **só** o `index.html`: título com a mesa, campos de nome e preço do item, botão Adicionar, lista de itens e total. Use ids simples e ligue `style.css` e `script.js`. Sem CSS nem JavaScript dentro do HTML.

---

## Mão na massa: index.html
1. Envie o **prompt 1** no chat do Copilot
2. Cole o resultado no `index.html` e salve
3. Recarregue a página: todos os campos apareceram?
4. Confira: tem a linha `meta viewport`? Os `id` fazem sentido?

[cronômetro 30]

---

## Prompt 2: o CSS
> Com o `index.html` aberto, crie **só** o `style.css`: pensado primeiro para celular, botões grandes e fáceis de tocar, e uma `@media` para telas maiores. Sem frameworks.

Deixe o `index.html` aberto no editor: o chat usa o arquivo aberto como contexto.

---

## Mão na massa: style.css
1. Envie o **prompt 2** e cole o resultado no `style.css`
2. No DevTools, aperte `Ctrl + Shift + M`: modo celular
3. Teste larguras diferentes: nada pode sair da tela
4. Ajuste uma cor ou tamanho **você mesmo**, sem a IA

[cronômetro 30]

---

## Prompt 3: o JavaScript
> Crie **só** o `script.js` para o `index.html` aberto: ao clicar em Adicionar, leia nome e preço, valide se estão preenchidos, adicione o item à lista e atualize o total com 2 casas decimais. Código simples, sem bibliotecas.

---

## Mão na massa: script.js
1. Envie o **prompt 3** e cole o resultado no `script.js`
2. Adicione 3 itens e confira o total **com a calculadora**
3. Teste o erro: clique em Adicionar com os campos vazios
4. Procure o `"22" + 8.5`: o preço está virando número?

[cronômetro 40]

---

## Comente o que a IA fez
```js
// Pega o botão pelo id que está no index.html
const botao = document.getElementById("btnAdicionar");

// Quando o garçom tocar em Adicionar, roda a função
botao.addEventListener("click", adicionarItem);
```

Explique **com as suas palavras** o que cada bloco faz. Se você não consegue explicar, pergunte, estude e só depois comente.

---

## Mão na massa: comentários
1. Em cada bloco do `script.js`, escreva um comentário `//`
2. No `style.css`, comente as regras principais com `/* */`
3. No `index.html`, comente as partes com `<!-- -->`
4. Troque de computador com um colega: ele entende o código?

[cronômetro 30]

---

## O console: onde os erros aparecem
Aperte **F12** e abra a aba **Console**. Erro aparece em **vermelho**, com o arquivo e a linha.

| Mensagem | Causa comum |
|---|---|
| `Cannot read properties of null` | `id` diferente no HTML e no JS |
| `adicionarItem is not defined` | Nome escrito diferente (maiúsculas contam) |
| Total `"228.5"` | Preço somado como texto: falta `Number()` |
| `NaN` | Conta feita com um campo vazio |

---

## Mão na massa: caça aos erros
1. Abra o **Console** e deixe aberto enquanto testa
2. Quebre de propósito: mude um `id` no HTML e veja o erro
3. Leia a mensagem, ache a **linha** e corrija
4. Se pedir ajuda à IA, cole a **mensagem de erro inteira**

[cronômetro 30]

---

## Salve no GitHub
1. Abra **Controle do código-fonte** na barra lateral
2. Escreva uma mensagem: `Tela da comanda`
3. Clique em **Commit** e depois em **Sync** (sincronizar)
4. Confira no site do GitHub: os 3 arquivos estão lá?

[cronômetro 10]

---

## Antes de entregar
- ✅ A tela **adiciona itens** e mostra na lista
- ✅ O **total** está certo, com 2 casas decimais
- ✅ O **console** não mostra nenhum erro em vermelho
- ✅ Funciona no **modo celular** do DevTools
- ✅ Cada bloco tem um **comentário** seu explicando

---

## Revisão
O total mostra `"228.5"` em vez de `30.5`. O que falta no código?

- [ ] Um `if`
- [ ] Um evento de clique
- [x] Converter o preço com `Number()`
- [ ] Mais um `console.log`

---

## Termômetro de novo
Levante os dedos outra vez e compare com o começo.

+ HTML
+ CSS
+ JavaScript
+ Variável e lista
+ Função e condição
+ Evento e console

---

## O que vimos hoje
+ **HTML** estrutura, **CSS** apresenta, **JavaScript** dá comportamento
+ Variável guarda, lista agrupa, função repete, `if` decide
+ Evento é o código **esperando** o clique
+ A IA gera um arquivo por vez; **você** lê, comenta e corrige
+ O **console** mostra o erro e a linha: leia antes de pedir ajuda

---

# A comanda tem cara
Na próxima, ela começa a guardar os dados

---
aula: 4
data: 2026-10-05
titulo: Do JavaScript ao projeto React gerado por IA
turma: IA
descricao: Fim da Aula 3 (evento, desafio final e a tela com o Copilot) e a estrutura de um projeto React/Next.js
fonte: grande
---

# O clique que decide
Aula 4: o checklist ganha tela, e você lê um projeto feito por IA

---

## O botão que não faz nada
+ O operador marca os 5 itens do **CAM-07**
+ Os **Freios** ficaram não conforme
+ Ele toca em **Finalizar**...
+ ... e **nada** acontece. Nenhum INAPTO, nenhum aviso
+ A função `avaliarInspecao` está pronta. O que falta?

---

## O que está faltando?
A função existe, o botão existe. Por que nada acontece no toque?

- [ ] Falta o CSS do botão
- [ ] Falta internet no celular
- [x] Falta o código que **espera o clique**
- [ ] Falta um `console.log`

---

## E depois do clique...
+ Peça um app a uma IA: ela devolve **dezenas** de arquivos
+ Pastas `app`, `components`, arquivos `.tsx`...
+ Você saberia achar **onde** está o apto ou inapto?
+ No fim de hoje, você vai saber

---

## Roteiro de hoje
- **Abertura** (5 min)
- **Parte 1**: ler e escrever JavaScript, com contas (65 min)
- **Parte 2**: a tela com o Copilot, começo (20 min)
- ☕ **Intervalo** (15 min)
- **Parte 2**: estilo, script, testes e Pages (40 min)
- **Parte 3**: por dentro de um projeto React/Next.js (30 min)

---

# Parte 1 — O que faltou do JavaScript
Ler, prever, contar e só depois codificar

---

## Onde paramos: a função
```js
function avaliarInspecao(itens) {
  for (const item of itens) {
    if (item.critico && item.conforme === false) {
      return 'INAPTO'
    }
  }
  return 'APTO'
}
```

Abra o PixelCode e o seu `funcao.js`: ainda está lá?

---

## Seu laboratório: o PixelCode
[qrcode https://tinyurl.com/pixelcode-jd tinyurl.com/pixelcode-jd]

---

## Relembrando
Os **Freios** (crítico) estão conformes e o **Cinto** (crítico) não. O que a função devolve?

- [ ] `'APTO'`: o primeiro item passou
- [x] `'INAPTO'`: um crítico falhou
- [ ] Nada: falta o `console.log`
- [ ] Um erro: são dois críticos

---

## 🔍 Antes de digitar, leia
+ Na vida real, você vai **ler** muito mais código do que escrever
+ Principalmente o código que a **IA** gerou
+ Leia **linha por linha**, de cima para baixo
+ **Preveja** o que vai aparecer no Console
+ Só depois **rode** e confira: acertou?

---

## Contas no JavaScript
| Sinal | Conta | Exemplo | Resultado |
|---|---|---|---|
| `+` | Soma | `3 + 2` | 5 |
| `-` | Subtração | `500 - 180` | 320 |
| `*` | Multiplicação | `25 * 12` | 300 |
| `/` | Divisão | `300 / 12` | 25 |

Como na matemática: `*` e `/` vêm **antes** de `+` e `-`. Os **parênteses** mudam a ordem.

---

## 🔍 Leia e preveja (1/5)
```js
const criticos = 3
const comuns = 2
console.log(criticos + comuns)
```

- [x] `5`
- [ ] `32`
- [ ] `criticos + comuns`
- [ ] `1`

---

## 🔍 Leia e preveja (2/5)
```js
const horas = '8'
console.log(horas + 2)
```

- [ ] `10`
- [x] `82`
- [ ] Um erro
- [ ] `6`

> Por quê: `'8'` com aspas é **texto**. Texto `+` número **junta**, não soma.

---

## 🔍 Leia e preveja (3/5)
```js
const litros = 300
const horas = 12
console.log(litros / horas)
```

- [ ] `3600`
- [ ] `288`
- [x] `25`
- [ ] `312`

---

## 🔍 Leia e preveja (4/5)
```js
let horimetro = 1250
horimetro = horimetro + 8
horimetro = horimetro + 8
console.log(horimetro)
```

- [ ] `1258`
- [x] `1266`
- [ ] `1250`
- [ ] `16`

---

## 🔍 Leia e preveja (5/5)
```js
const conformes = 4
const total = 5
console.log(conformes / total * 100)
```

- [x] `80`
- [ ] `0.008`
- [ ] `20`
- [ ] `400`

> Por quê: da esquerda para a direita: `4 / 5` = 0.8, e `0.8 * 100` = 80.

---

## 🎯 Pedido 1: guardar e mostrar
Contexto: o horímetro do **CAM-07** marca **1250** horas.

1. Crie o arquivo `contas.js`
2. Crie uma variável com o horímetro
3. Mostre o valor dela no Console

---

## 🎯 Pedido 2: somar dois números
Contexto: o CAM-07 tem **3** itens críticos e **4** itens comuns.

1. Crie uma variável para cada número
2. Crie uma terceira variável com a **soma** das duas
3. Mostre o total no Console

---

## 🎯 Pedido 3: subtrair
Contexto: o tanque leva **500** litros e o marcador mostra **180**.

1. Crie as duas variáveis
2. Calcule quanto **falta** para encher
3. Mostre o resultado

---

## 🎯 Pedido 4: multiplicar
Contexto: o caminhão gasta **25** litros por hora, e o turno tem **12** horas.

1. Crie as duas variáveis
2. Calcule quantos litros ele gasta **no turno**
3. Mostre o resultado

---

## 🎯 Pedido 5: dividir
Contexto: **900** litros de diesel vão ser divididos por igual entre **6** caminhões.

1. Crie as duas variáveis
2. Calcule quanto vai para **cada** caminhão
3. Mostre o resultado

---

## 🎯 Pedido 6: somar e dividir
Contexto: o operador trabalhou **8**, **10** e **6** horas em 3 turnos.

1. Crie uma variável para cada turno
2. Calcule a **média**: some os três e divida por 3
3. Mostre o resultado. Deu certo? Lembre dos **parênteses**

---

## 🎯 Pedido 7: porcentagem
Contexto: na inspeção, **7** de **8** itens ficaram conformes.

1. Crie as duas variáveis
2. Calcule a **% de conformidade**
3. Mostre o resultado

---

## 🎯 Pedido 8: texto com número
Contexto: o operador não entende só um número solto no Console.

1. Volte ao Pedido 3, do tanque
2. Mostre uma frase: `Faltam ... litros para encher`
3. Use o `+` para juntar o texto e a variável

---

## 🎯 Pedido 9: o valor que muda
Contexto: a cada turno de **8** horas, o horímetro aumenta.

1. Crie o horímetro com `let`, valendo **1250**
2. Some 8 horas a ele, **três vezes**, uma linha para cada turno
3. Mostre o valor no fim. Por que tem que ser `let`?

---

## 🔍 Leia e preveja: função
```js
function consumo(litros, horas) {
  return litros / horas
}
console.log(consumo(240, 8))
```

- [x] `30`
- [ ] `1920`
- [ ] `248`
- [ ] `consumo`

---

## 🎯 Pedido 10: a primeira função
Contexto: o supervisor faz a mesma soma o dia inteiro.

1. Crie a função `somar(a, b)` que **devolve** `a + b`
2. Mostre `somar(3, 4)` no Console
3. Agora mostre `somar(1250, 8)`: a mesma função, outros números

---

## 🎯 Pedido 11: função do tanque
Contexto: todo caminhão tem um tanque diferente.

1. Crie a função `falta(capacidade, atual)`
2. Ela devolve quanto falta para encher
3. Teste com `falta(500, 180)` e `falta(800, 650)`

---

## 🎯 Pedido 12: função da conformidade
Contexto: cada equipamento tem um número diferente de itens.

1. Crie a função `percentual(conformes, total)`
2. Ela devolve a % de conformidade
3. Teste com `percentual(7, 8)` e `percentual(5, 5)`

---

## 🔍 Leia e preveja: evento
```js
botao.addEventListener('click', () => {
  saida.textContent = 'Inspeção finalizada!'
})
```

Quando a frase aparece na tela?

- [ ] Assim que a página abre
- [x] Quando o operador clica no botão
- [ ] Nunca: falta o `console.log`
- [ ] A cada segundo

---

## Evento: quando o operador toca
+ `document.querySelector('#finalizar')`: acha a peça com esse `id`
+ `addEventListener('click', ...)`: "**quando clicar**, faça isto"
+ `saida.textContent = ...`: escreve no parágrafo
+ Sem clique, **nada** acontece: o código fica esperando
+ No PixelCode, é o modo **Página web**

---

## Exemplo: evento (1/2)
```html
<h1>Inspeção do CAM-07</h1>
<button id="finalizar">Finalizar</button>
<p id="resultado"></p>
```

Modo **Página web**, `index.html`: troque o miolo do `<body>` por isto.

---

## Exemplo: evento (2/2)
```js
const botao = document.querySelector('#finalizar')
const saida = document.querySelector('#resultado')
botao.addEventListener('click', () => {
  saida.textContent = 'Inspeção finalizada!'
})
```

No `script.js`: apague tudo e digite isto. Clique em **Finalizar**.

---

## 🎯 Desafio: o botão Limpar
Contexto: o operador errou e quer **recomeçar**.

1. No `index.html`, crie `<button id="limpar">Limpar</button>`
2. No `script.js`, pegue o botão: `querySelector('#limpar')`
3. No clique dele, escreva `''` (nada) na `saida`
4. Teste: Finalizar escreve, Limpar apaga?

---

## 🎯 Desafio: o resultado de verdade
Contexto: o clique tem que **decidir**, não só avisar.

1. Cole a função `avaliarInspecao` e a lista `itens` no `script.js`
2. No clique do Finalizar, chame a função
3. Escreva na `saida`: `Resultado: ` + o que ela devolveu
4. Faça os **Freios** falharem: apareceu INAPTO?

---

## 🎯 Pedido: o botão Calcular
Contexto: o supervisor quer ver a **% de conformidade** na tela.

1. No `index.html`, crie um botão com `id="calcular"`
2. No `script.js`, pegue o botão com `querySelector`
3. No clique, faça a conta com `4` conformes de `5` itens
4. Escreva na `saida`: `Conformidade: ` + o resultado + `%`

---

## Qual peça?
O que faz o código rodar quando o operador **toca** em Finalizar?

- [ ] A variável `resultado`
- [ ] A lista `itens`
- [x] O evento de clique no Finalizar
- [ ] O `@media` do CSS

---

## Quando dá erro
| O Console diz | O que aconteceu |
|---|---|
| `resultdo is not defined` | Nome escrito **diferente** |
| `Assignment to constant variable` | Tentou mudar uma `const` |
| `Unexpected end of input` | Faltou fechar `}` ou `)` |
| `Cannot read properties of null` | O `id` não existe no HTML |

Clique em **(arquivo, linha)** e o PixelCode leva até lá.

---

## 🎯 Desafio: caça ao erro
Contexto: um colega mexeu no seu código e "nada funciona".

1. Troque `'#finalizar'` por `'#finaliza'` e clique: que erro saiu?
2. Desfaça. Agora apague uma `}` no fim: e agora?
3. Desfaça e confira: voltou a funcionar?

> Ler o erro com calma resolve **metade** dos problemas.

---

## Comentários no código
```text
<!-- HTML: a lista de itens da inspeção -->
/* CSS: botão largo para tocar com luva */
// JS: confere cada item da lista
```

O computador **ignora** os comentários: eles são para **pessoas**.

---

## Comentário bom x ruim
- ✗ `// função` (só repete o que já está escrito)
- ✗ `// isso aqui faz coisas`
- ✓ `// se um item crítico falhar, o equipamento não sai`
- ✓ `// botão largo: o operador usa luva`

> Bom comentário diz **para que serve** e **por quê**.

---

## As 5 peças da lógica
| Peça | No checklist |
|---|---|
| **Variável** | `resultado`: guarda APTO ou INAPTO |
| **Lista** | `itens`: os itens do checklist |
| **Condição** | Item crítico não conforme → **INAPTO** |
| **Função** | `avaliarInspecao()`: avalia a inspeção |
| **Evento** | O clique em **Finalizar** põe tudo para rodar |

---

## 🏁 Desafio final: o checklist
Contexto: tudo num programa só, no arquivo `checklist.js` (modo **Só JavaScript**).

1. Monte a lista `itens` com os 5 itens (3 críticos)
2. Com o `for`, mostre `OK` ou `FALHOU` antes de cada nome
3. Crie a função `avaliarInspecao(itens)`
4. Crie `equipamento` e `operador` e mostre o resultado
5. Teste: tudo ok, Limpeza falhando, Freios falhando

---

## 🧩 Referência: final (1/4)
```js
const itens = [
  { nome: 'Freios', critico: true, conforme: true },
  { nome: 'Pneus', critico: true, conforme: true },
  { nome: 'Cinto', critico: true, conforme: true },
  { nome: 'Limpeza', critico: false, conforme: false },
  { nome: 'Combustível', critico: false, conforme: true },
]
```

Só a **Limpeza** está falhando. Depois, faça os Freios falharem.

---

## 🧩 Referência: final (2/4)
```js
for (const item of itens) {
  if (item.conforme) {
    console.log('OK ' + item.nome)
  } else {
    console.log('FALHOU ' + item.nome)
  }
}
```

---

## 🧩 Referência: final (3/4)
```js
function avaliarInspecao(itens) {
  for (const item of itens) {
    if (item.critico && item.conforme === false) {
      return 'INAPTO'
    }
  }
  return 'APTO'
}
```

---

## 🧩 Referência: final (4/4)
```js
const equipamento = 'CAM-07'
const operador = 'Ana'
const resultado = avaliarInspecao(itens)
console.log(operador + ' inspecionou o ' + equipamento)
console.log('Resultado: ' + resultado)
```

Limpeza falhando: **APTO**. Freios falhando: **INAPTO**. Agora, **comente** cada parte.

---

# Parte 2 — A tela do checklist
Com o Copilot, um arquivo por vez

---

## Do PixelCode para o Codespace
1. No PixelCode, no `checklist.js`: **Ctrl + A** e **Ctrl + C**
2. No Codespace: **Novo arquivo** (📄+) → `checklist.js`
3. Cole, salve e rode no terminal: `node checklist.js`
4. `git add checklist.js`, commit e push

> O PixelCode guarda só **neste navegador**; o GitHub guarda de verdade.

---

## O plano: um arquivo por vez
1. `index.html`: pede, revisa, abre no navegador
2. `style.css`: pede, revisa, testa no modo celular
3. `script.js`: pede, revisa, testa apto e inapto
4. Comenta os 3 arquivos com as **suas** palavras
5. Commit e push a cada arquivo pronto

---

## O que vai ser observado
+ A sua tela calcula **certo** o APTO e o INAPTO?
+ Você **explicou**, em comentários, o código que a IA gerou?
+ Não é sobre a tela mais bonita: é sobre **funcionar** e **entender**

---

## Copilot Free: o que você tem
+ **Sugestões** enquanto você digita: 2.000 por mês
+ **Chat** para pedir e perguntar: **50 mensagens por mês**
+ Hoje: 3 para os arquivos, algumas para correções e 5 na Parte 3
+ Um bom prompt economiza mensagens

---

## Ativando o Copilot
1. No Codespace, abra **Extensões** na barra lateral
2. Procure **GitHub Copilot** e instale, se ainda não estiver
3. Entre com a sua conta do GitHub quando ele pedir
4. Abra o **chat do Copilot** pelo ícone dele no topo

---

## Prompt claro: 3 partes
| Parte | Pergunta | Exemplo |
|---|---|---|
| **Contexto** | Onde estou? | Checklist de inspeção, no celular |
| **Tarefa** | O que eu quero? | Crie **só** o `index.html` |
| **Formato** | Como quero? | Sem comentários: eu comento |

No chat, `#index.html` mostra ao Copilot o arquivo que já existe.

---

## Copie os prompts
[qrcode https://instrutorjd.github.io/portal_aulas/materiais/prompts-checklist/ instrutorjd.github.io/portal_aulas/materiais/prompts-checklist]

Abra **no computador**, numa aba ao lado do Codespace.

---

## Mão na massa: index.html
1. Cole o **prompt 1** no chat do Copilot
2. A resposta vem **aos poucos**: é **streaming**!
3. Leia o arquivo antes de clicar em **Manter** (*Keep*)
4. Ache o `select`, os rádios e o `id` do botão e do resultado
5. Os `name` estão **sem acento**? Tem o link do CSS e do JS?

---

## Rodando no Codespace
```bash
python3 -m http.server 8000
```

+ Aparece um aviso: clique em **Abrir no navegador** (*Open in Browser*)
+ Perdeu o aviso? Aba **Portas** (*Ports*), porta `8000`, ícone 🌐
+ Mudou o código? Salve e dê **F5** na página

---

# ☕ Intervalo: 15 min
Na volta: a tela ganha **roupa** com o `style.css` e **cérebro** com o `script.js`

---

## Mão na massa: style.css
1. Cole o **prompt 2** no chat e revise antes de **Manter**
2. Dê **F5** na página: ela ganhou roupa?
3. **F12** → **Ctrl + Shift + M**: escolha um celular
4. Dá para tocar nas opções sem errar? A letra está legível?
5. `git add .`, `git commit -m "Tela e estilo"` e `git push`

---

## Mão na massa: script.js
1. Cole o **prompt 3** no chat e revise antes de **Manter**
2. Ache as **5 peças**: variável, lista, função, condição e evento
3. Compare com o **seu** `checklist.js`: o que é parecido?
4. Os nomes da lista batem com os `name` dos rádios?
5. **F5**, **F12** → **Console** aberto, e faça os testes

---

## Testes: a tela calcula certo?
| Você marca | A tela deve mostrar |
|---|---|
| Tudo conforme | ✅ **APTO** |
| Só a Limpeza não conforme | ✅ **APTO** |
| Freios não conforme | ⛔ **INAPTO** |
| Faltou um item ou o equipamento | Um **aviso** para completar |

Errou algum? Ainda não está pronto.

---

## Pedindo a correção ao Copilot
1. Leia o erro e clique em **arquivo:linha**
2. Tente entender **sozinho** primeiro: é nome? É `id`?
3. Não achou? Use o **prompt de correção** da página
4. Cole a frase **exata** do erro e diga o que você fez
5. Revise a mudança: ele mexeu **só** no necessário?

---

## Mão na massa: comente o código
1. `index.html`: um comentário por **bloco**
2. `style.css`: diga **por que** cada regra importante existe
3. `script.js`: comente as **5 peças** com as suas palavras
4. Travou? Pergunte ao Copilot, mas **escreva você**
5. `git add .`, `git commit -m "Checklist comentado"` e `git push`

---

## Ativando o GitHub Pages
1. No site do GitHub: repositório → **Settings** → **Pages**
2. **Source**: **Deploy from a branch**
3. **Branch**: `main` e a pasta `/ (root)` → **Save**
4. Espere ~1 min: o endereço aparece no topo (**Visit site**)
5. Abra no **celular** e refaça os 4 testes

> Endereço: `seu-usuario.github.io/checklist-inspecao`

---

## Revisão
O Console mostra `Cannot read properties of null`. O que você confere primeiro?

- [ ] Se a internet caiu
- [x] Se o `id` usado no JS existe no HTML
- [ ] Se o CSS tem `@media`
- [ ] Se fez `git push`

---

# Parte 3 — Por dentro de um projeto feito por IA
React, TypeScript e Next.js

---

## O que a IA entrega
+ Ferramentas como **v0** e **Lovable** geram apps em **React**
+ Quase sempre com **TypeScript**: arquivos `.ts` e `.tsx`
+ Muitas vezes com **Next.js**, que organiza as páginas
+ Funciona? Ótimo. Mas quem **mantém** precisa se achar lá dentro
+ Hoje: **ler** um projeto desses, não escrever do zero

---

## As 4 peças do React
| Peça | O que é | No checklist |
|---|---|---|
| **Componente** | Função que devolve um pedaço da tela | `ItemChecklist` |
| **Props** | Dados que o componente **recebe** | O `item` a mostrar |
| **Estado** | A **memória** do componente | Itens marcados, resultado |
| **Tipo** (TS) | O **formato** que um dado precisa ter | `Item`, `Resultado` |

---

## Componente: uma peça da tela
```tsx
function ItemChecklist({ item }: Props) {
  return (
    <fieldset>
      <legend>{item.nome}</legend>
      ...os rádios Conforme e Não conforme
    </fieldset>
  )
}
```

Uma **função** que devolve HTML. Escreve uma vez, usa 5 vezes.

---

## Props: o que a peça recebe
```tsx
<ItemChecklist item={freios} />
<ItemChecklist item={pneus} />
```

+ Igual ao **parâmetro** da função da Aula 3: `avaliarInspecao(itens)`
+ A mesma peça, com **dados diferentes**
+ Quem recebe a prop **só lê**: não muda o que veio de fora

---

## Estado: a memória da tela
```tsx
const [resultado, setResultado] =
  useState<Resultado | null>(null)
setResultado('INAPTO')
```

+ Na Aula 3: `saida.textContent = ...` **você** muda a tela
+ No React: você muda o **estado**, e ele **redesenha** sozinho
+ No checklist: os **itens marcados** e o **resultado**

---

## TypeScript: o JavaScript com tipos
```ts
type Item = {
  nome: string
  critico: boolean
  conforme: boolean | null
}
type Resultado = 'APTO' | 'INAPTO'
```

`null` = ainda não marcado. Escreveu `'APTA'`? O editor sublinha **antes** de rodar.

---

## Next.js: cada pasta é uma página
| Arquivo | Endereço no navegador |
|---|---|
| `app/page.tsx` | `/` (a inspeção) |
| `app/historico/page.tsx` | `/historico` |
| `app/layout.tsx` | A moldura de **todas** as páginas |
| `components/` | As peças reutilizáveis |
| `lib/` | Tipos, dados e a função de avaliar |

---

## Da Aula 3 para o React
| No seu JavaScript | No projeto React/Next |
|---|---|
| `function avaliarInspecao(itens)` | A mesma, com **tipos** |
| Parâmetro da função | **Props** do componente |
| `let` + `textContent` | **Estado** com `useState` |
| `addEventListener('click', ...)` | `onClick={finalizar}` |
| `index.html` | `app/page.tsx` |

---

## Qual peça?
O `ItemChecklist` recebe `item={freios}`. O que é esse `item`?

- [ ] Um estado
- [x] Uma prop
- [ ] Um tipo
- [ ] Uma página

---

## Mão na massa: o projeto base
```bash
npx degit \
  InstrutorJD/portal_aulas/materiais/checklist-next \
  checklist-next
cd checklist-next
npm install
npm run dev
```

No Codespace, na raiz do `checklist-inspecao`. O servidor do Python está ligado? **Ctrl + C** antes.

---

## Mão na massa: teste o app
1. Clique em **Abrir no navegador** (porta `3000`)
2. Marque tudo conforme e **Finalizar**: APTO?
3. Freios **não conforme**: INAPTO?
4. Clique em **Histórico** no menu: o endereço mudou para?
5. Deixe um item sem marcar e finalize: o que acontece?

---

## Mão na massa: caça às peças
1. Abra o `checklist-next/README.md` no Codespace
2. Lá está o **checklist de análise**: 10 peças para achar
3. Use as **5 perguntas** do README no chat do Copilot
4. Confira **abrindo o arquivo**: a IA também erra
5. Preencha a coluna **Onde está?** com arquivo e linha

---

## Mão na massa: entregue a análise
```bash
cd ..
git add checklist-next
git commit -m "Analise do projeto Next"
git push
```

A pasta `node_modules` **não** vai: o `.gitignore` do projeto barra.

> Sobrou tempo? O **desafio** do README: crie a página `/sobre`.

---

## Revisão
Qual arquivo abre quando você acessa `/historico`?

- [ ] `components/historico.tsx`
- [ ] `historico.html`
- [x] `app/historico/page.tsx`
- [ ] `app/layout.tsx`

---

## Revisão
O resultado aparece na tela logo depois do `setResultado`. Por quê?

- [ ] Porque o `onClick` recarrega a página
- [x] Porque mudar o **estado** faz o React redesenhar
- [ ] Porque o TypeScript atualiza a tela
- [ ] Porque o Next.js cria uma página nova

---

## O que vimos hoje
+ **Ler e prever** antes de rodar; o **evento** liga o clique à função
+ A tela do checklist: Copilot, testes, comentários e **Pages**
+ React: **componentes** recebem **props** e guardam **estado**
+ **TypeScript** dá formato aos dados; no **Next.js**, pasta é página
+ Projeto gerado por IA: você **lê**, **acha** e **confere**

---

# Você leu o que a IA escreveu
E achou, peça por peça, onde mora o apto ou inapto
